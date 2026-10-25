import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { IdentityProfile } from '../../core/beauty.model';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUS,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../core/support/support-ticket.model';
import { SupportTicketService } from '../../core/support/support-ticket.service';
import { PageHeader } from '../../shared/page-header/page-header';

type StatusFilter = 'all' | 'open' | 'closed';

/** Müşterinin destek talebi açtığı ve taleplerinin durumunu izlediği ekran. */
@Component({
  imports: [DatePipe, NgTemplateOutlet, PageHeader, ReactiveFormsModule],
  selector: 'app-support',
  templateUrl: './support.html',
})
export class Support {
  private readonly tickets = inject(SupportTicketService);
  private readonly api = inject(ApiClient);
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = SUPPORT_CATEGORIES;
  protected readonly priorities = SUPPORT_PRIORITIES;
  protected readonly statusMeta = SUPPORT_STATUS;
  protected readonly steps: readonly SupportTicketStatus[] = [
    'pending',
    'in_progress',
    'completed',
  ];

  protected readonly form = this.fb.nonNullable.group({
    category: ['technical_support', Validators.required],
    priority: ['normal' as SupportTicketPriority],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly created = signal<SupportTicket | null>(null);

  protected readonly list = signal<SupportTicket[]>([]);
  protected readonly listLoading = signal(false);
  protected readonly listError = signal('');
  protected readonly filter = signal<StatusFilter>('all');
  protected readonly selectedId = signal<string | null>(null);

  protected readonly trackCode = signal('');
  protected readonly tracking = signal(false);
  protected readonly trackError = signal('');
  protected readonly tracked = signal<SupportTicket | null>(null);

  private tenantId = '';

  protected readonly counts = computed(() => {
    const items = this.list();
    const open = items.filter((t) => this.isOpen(t.status)).length;
    return { all: items.length, open, closed: items.length - open };
  });

  protected readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.list();
    return this.list().filter((t) => (f === 'open') === this.isOpen(t.status));
  });

  protected readonly selected = computed(
    () => this.list().find((t) => t.id === this.selectedId()) ?? null,
  );

  constructor() {
    const user = this.auth.currentUser();
    this.form.patchValue({
      fullName: user?.displayName ?? '',
      email: user?.email ?? '',
    });
    void this.loadProfile();
    void this.loadMine();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const category = this.categories.find((c) => c.value === value.category);
    this.submitting.set(true);
    this.submitError.set('');
    try {
      const ticket = await this.tickets.create({
        category: value.category,
        categoryLabel: category?.label,
        subject: value.subject.trim(),
        description: value.description.trim(),
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim() || undefined,
        priority: value.priority,
        tenantId: this.tenantId || undefined,
      });
      this.created.set(ticket);
      this.form.patchValue({ subject: '', description: '', priority: 'normal' });
      this.form.markAsUntouched();
      this.list.update((items) => [ticket, ...items.filter((t) => t.id !== ticket.id)]);
      this.selectedId.set(ticket.id);
    } catch (error) {
      this.submitError.set((error as Error).message);
    } finally {
      this.submitting.set(false);
    }
  }

  protected async loadMine(): Promise<void> {
    const email = this.form.controls.email.value || this.auth.currentUser()?.email || '';
    if (!email) return;
    this.listLoading.set(true);
    this.listError.set('');
    try {
      this.list.set(await this.tickets.mine(email));
    } catch (error) {
      this.listError.set((error as Error).message);
    } finally {
      this.listLoading.set(false);
    }
  }

  protected async track(): Promise<void> {
    const code = this.trackCode().trim();
    if (!code) return;
    this.tracking.set(true);
    this.trackError.set('');
    this.tracked.set(null);
    try {
      this.tracked.set(await this.tickets.track(code));
    } catch (error) {
      this.trackError.set((error as Error).message);
    } finally {
      this.tracking.set(false);
    }
  }

  protected toggle(id: string): void {
    this.selectedId.update((current) => (current === id ? null : id));
  }

  protected async copy(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Panoya erişim yoksa sessizce geç; numara ekranda görünür.
    }
  }

  protected isOpen(status: SupportTicketStatus): boolean {
    return status !== 'completed' && status !== 'rejected';
  }

  /** Durum çizelgesinde bir adımın tamamlanıp tamamlanmadığı. */
  protected stepDone(ticket: SupportTicket, step: SupportTicketStatus): boolean {
    const order: Record<SupportTicketStatus, number> = {
      pending: 0,
      in_progress: 1,
      approved: 1,
      completed: 2,
      rejected: 2,
    };
    return order[ticket.status] >= order[step];
  }

  protected toneClass(status: SupportTicketStatus): string {
    const tones: Record<string, string> = {
      amber:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
      indigo:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
      emerald:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
      rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    };
    return tones[this.statusMeta[status]?.tone ?? 'amber'];
  }

  protected hint(ticket: SupportTicket): string {
    return this.statusMeta[ticket.status]?.hint ?? '';
  }

  protected priorityLabel(priority: SupportTicketPriority): string {
    return this.priorities.find((p) => p.value === priority)?.label ?? priority;
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  private async loadProfile(): Promise<void> {
    try {
      const profile = (await firstValueFrom(this.api.request<IdentityProfile>('GET', 'beauty/me')))
        .data;
      this.tenantId = profile.tenantId ?? '';
      const before = this.form.controls.email.value;
      this.form.patchValue({
        fullName: this.form.controls.fullName.value || profile.displayName || '',
        email: before || profile.email || '',
      });
      if (!before && profile.email) await this.loadMine();
    } catch {
      // Profil okunamazsa form elle doldurulabilir.
    }
  }
}
