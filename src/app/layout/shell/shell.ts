import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { BranchRecord, IdentityProfile, NavSection } from '../../core/beauty.model';
import { BranchService } from '../../core/branch.service';
import { I18nStore } from '../../core/i18n/i18n.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Theme } from '../../core/theme';
import { LanguageSelector } from '../../shared/language-selector/language-selector';

import { VersionService } from '../../core/version/version.service';

interface CollapsibleNavSection {
  key: string;
  items: { key: string; icon: string; route: string }[];
}

@Component({
  imports: [LanguageSelector, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  protected readonly auth = inject(Auth);
  protected readonly theme = inject(Theme);
  protected readonly i18n = inject(I18nStore);
  protected readonly branchService = inject(BranchService);
  protected readonly version = inject(VersionService);
  protected readonly menuOpen = signal(false);
  protected readonly activeBranchId = signal('');

  // Collapsible menu groups state: mapping section label -> boolean
  protected readonly expandedSections = signal<Record<string, boolean>>({
    'nav.section.operation': true,
    'nav.section.customerCare': true,
    'nav.section.definitions': true,
    'nav.section.team': false,
    'nav.section.financeStock': false,
    'nav.section.growthManagement': false,
  });

  protected readonly branches = resource({
    loader: async () => this.branchService.ensureBranches(),
  });
  protected readonly profile = resource({
    loader: async () =>
      (await firstValueFrom(this.api.request<IdentityProfile>('GET', 'beauty/me'))).data,
  });

  protected readonly sections: readonly CollapsibleNavSection[] = [
    {
      key: 'nav.section.operation',
      items: [
        { key: 'nav.dashboard', icon: 'space_dashboard', route: '/dashboard' },
        { key: 'nav.calendar', icon: 'calendar_month', route: '/appointments' },
        { key: 'nav.waitlist', icon: 'hourglass_top', route: '/waitlist' },
      ],
    },
    {
      key: 'nav.section.customerCare',
      items: [
        { key: 'nav.customers', icon: 'group', route: '/customers' },
        { key: 'nav.customerHealth', icon: 'health_and_safety', route: '/customer-health' },
        { key: 'nav.consents', icon: 'verified_user', route: '/consents' },
        { key: 'nav.packages', icon: 'card_membership', route: '/packages' },
        { key: 'nav.sessions', icon: 'spa', route: '/sessions' },
      ],
    },
    {
      key: 'nav.section.definitions',
      items: [
        { key: 'nav.definitions', icon: 'tune', route: '/definitions' },
        { key: 'nav.services', icon: 'auto_awesome', route: '/services' },
        { key: 'nav.serviceCategories', icon: 'category', route: '/service-categories' },
        { key: 'nav.servicePackages', icon: 'redeem', route: '/service-packages' },
        { key: 'nav.devices', icon: 'developer_board', route: '/devices' },
        { key: 'nav.rooms', icon: 'meeting_room', route: '/rooms' },
      ],
    },
    {
      key: 'nav.section.team',
      items: [
        { key: 'nav.staff', icon: 'badge', route: '/staff' },
        { key: 'nav.shifts', icon: 'schedule', route: '/shifts' },
        { key: 'nav.timeOff', icon: 'event_busy', route: '/time-off' },
        { key: 'nav.commissions', icon: 'percent', route: '/commissions' },
      ],
    },
    {
      key: 'nav.section.financeStock',
      items: [
        { key: 'nav.payments', icon: 'payments', route: '/payments' },
        { key: 'nav.invoices', icon: 'receipt_long', route: '/invoices' },
        { key: 'nav.expenses', icon: 'account_balance_wallet', route: '/expenses' },
        { key: 'nav.products', icon: 'inventory_2', route: '/products' },
        { key: 'nav.inventory', icon: 'sync_alt', route: '/inventory-transactions' },
        { key: 'nav.suppliers', icon: 'local_shipping', route: '/suppliers' },
      ],
    },
    {
      key: 'nav.section.growthManagement',
      items: [
        { key: 'nav.campaigns', icon: 'campaign', route: '/campaigns' },
        { key: 'nav.reports', icon: 'monitoring', route: '/reports' },
        { key: 'nav.aiRecommendations', icon: 'neurology', route: '/ai-recommendations' },
        { key: 'nav.audit', icon: 'manage_search', route: '/audit-logs' },
        { key: 'nav.settings', icon: 'settings', route: '/settings' },
      ],
    },
  ];

  protected readonly today = computed(() => {
    const lang = this.i18n.currentLang();
    const locale =
      lang === 'tr'
        ? 'tr-TR'
        : lang === 'de'
          ? 'de-DE'
          : lang === 'fr'
            ? 'fr-FR'
            : lang === 'es'
              ? 'es-ES'
              : lang === 'ar'
                ? 'ar-SA'
                : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  });

  constructor() {
    // Automatically ensure the section containing the current route is expanded
    const currentUrl = this.router.url;
    for (const section of this.sections) {
      if (section.items.some((item) => currentUrl.includes(item.route))) {
        this.expandedSections.update((prev) => ({ ...prev, [section.key]: true }));
        break;
      }
    }
  }

  protected isSectionExpanded(key: string): boolean {
    return this.expandedSections()[key] ?? true;
  }

  protected toggleSection(key: string): void {
    this.expandedSections.update((prev) => ({
      ...prev,
      [key]: !this.isSectionExpanded(key),
    }));
  }

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
    return selected?.name ?? this.i18n.t('action.allBranches');
  }

  protected selectBranch(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.activeBranchId.set(id);
    this.branchService.selectBranch(id);
  }
}
