import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { BranchRecord, IdentityProfile, NavItem } from '../../core/beauty.model';
import { Theme } from '../../core/theme';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  private readonly api = inject(ApiClient);
  protected readonly auth = inject(Auth);
  protected readonly theme = inject(Theme);
  protected readonly menuOpen = signal(false);
  protected readonly activeBranchId = signal('');
  protected readonly branches = resource({
    loader: async () =>
      (await firstValueFrom(this.api.list<BranchRecord>('branches', { limit: 100 }))).data,
  });
  protected readonly profile = resource({
    loader: async () =>
      (await firstValueFrom(this.api.request<IdentityProfile>('GET', 'beauty/me'))).data,
  });
  protected readonly items: readonly NavItem[] = [
    { label: 'Genel Bakış', icon: '⌂', route: '/dashboard' },
    { label: 'Randevu Takvimi', icon: '◫', route: '/appointments' },
    { label: 'Müşteri CRM', icon: '◉', route: '/customers' },
    { label: 'Paket ve Seans', icon: '◇', route: '/sessions' },
    { label: 'Hizmetler', icon: '✦', route: '/catalog' },
    { label: 'Cihaz ve Odalar', icon: '▣', route: '/resources' },
    { label: 'Personel', icon: '♙', route: '/staff' },
    { label: 'Kasa ve Finans', icon: '₺', route: '/finance' },
    { label: 'Stok', icon: '▤', route: '/inventory' },
    { label: 'Kampanyalar', icon: '✧', route: '/campaigns' },
    { label: 'Raporlar', icon: '↗', route: '/reports' },
    { label: 'AI Öneri', icon: '✺', route: '/ai-recommendations' },
    { label: 'Ayarlar', icon: '⚙', route: '/settings' },
  ];
  protected readonly today = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(),
    ),
  );
  protected displayName(): string {
    return (
      this.profile.value()?.displayName ||
      this.auth.currentUser()?.displayName ||
      this.auth.currentUser()?.email?.split('@')[0] ||
      'Kullanıcı'
    );
  }
  protected initials(): string {
    return (
      this.displayName()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toLocaleUpperCase('tr') ?? '')
        .join('') || 'OD'
    );
  }
  protected branchName(): string {
    const branches = this.branches.value() ?? [];
    const selected = branches.find((branch) => branch.id === this.activeBranchId()) ?? branches[0];
    return selected?.name ?? 'Şube seçilmedi';
  }
  protected selectBranch(event: Event): void {
    this.activeBranchId.set((event.target as HTMLSelectElement).value);
  }
}
