import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { BranchRecord, IdentityProfile, NavSection } from '../../core/beauty.model';
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
  protected readonly sections: readonly NavSection[] = [
    {
      label: 'OPERASYON',
      items: [
        { label: 'Genel Bakis', icon: 'space_dashboard', route: '/dashboard' },
        { label: 'Randevu Takvimi', icon: 'calendar_month', route: '/appointments' },
        { label: 'Bekleme Listesi', icon: 'hourglass_top', route: '/waitlist' },
      ],
    },
    {
      label: 'MUSTERI VE BAKIM',
      items: [
        { label: 'Musteri CRM', icon: 'group', route: '/customers' },
        { label: 'Saglik Beyanlari', icon: 'health_and_safety', route: '/customer-health' },
        { label: 'Onam ve KVKK', icon: 'verified_user', route: '/consents' },
        { label: 'Paket Satislari', icon: 'card_membership', route: '/packages' },
        { label: 'Seans Uygulamalari', icon: 'spa', route: '/sessions' },
      ],
    },
    {
      label: 'KATALOG VE KAYNAK',
      items: [
        { label: 'Hizmetler', icon: 'auto_awesome', route: '/services' },
        { label: 'Kategoriler', icon: 'category', route: '/service-categories' },
        { label: 'Paket Tanimlari', icon: 'redeem', route: '/service-packages' },
        { label: 'Cihazlar', icon: 'developer_board', route: '/devices' },
        { label: 'Odalar', icon: 'meeting_room', route: '/rooms' },
      ],
    },
    {
      label: 'EKIP',
      items: [
        { label: 'Personel', icon: 'badge', route: '/staff' },
        { label: 'Vardiya Plani', icon: 'schedule', route: '/shifts' },
        { label: 'Izin ve Tatiller', icon: 'event_busy', route: '/time-off' },
        { label: 'Komisyonlar', icon: 'percent', route: '/commissions' },
      ],
    },
    {
      label: 'FINANS VE STOK',
      items: [
        { label: 'Odemeler', icon: 'payments', route: '/payments' },
        { label: 'Faturalar', icon: 'receipt_long', route: '/invoices' },
        { label: 'Giderler', icon: 'account_balance_wallet', route: '/expenses' },
        { label: 'Urun Stogu', icon: 'inventory_2', route: '/products' },
        { label: 'Stok Hareketleri', icon: 'sync_alt', route: '/inventory-transactions' },
        { label: 'Tedarikciler', icon: 'local_shipping', route: '/suppliers' },
      ],
    },
    {
      label: 'BUYUME VE YONETIM',
      items: [
        { label: 'Kampanyalar', icon: 'campaign', route: '/campaigns' },
        { label: 'Rapor Merkezi', icon: 'monitoring', route: '/reports' },
        { label: 'AI Bakim Onerisi', icon: 'neurology', route: '/ai-recommendations' },
        { label: 'Denetim Kayitlari', icon: 'manage_search', route: '/audit-logs' },
        { label: 'Ayarlar', icon: 'settings', route: '/settings' },
      ],
    },
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
