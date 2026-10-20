import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<string>();

  protected readonly badgeClass = computed(() => {
    const s = this.status().toLowerCase();
    if (['active', 'paid', 'completed', 'healthy', 'configured', 'available', 'vip'].includes(s)) {
      return 'badge-emerald odv-badge';
    }
    if (['critical', 'refunded', 'cancelled', 'maintenance', 'error'].includes(s)) {
      return 'badge-rose odv-badge';
    }
    if (['draft', 'partial', 'due', 'review', 'processing', 'pending', 'waiting'].includes(s)) {
      return 'badge-amber odv-badge';
    }
    if (['scheduled', 'in-progress', 'confirmed', 'ready'].includes(s)) {
      return 'badge-sky odv-badge';
    }
    if (['premium', 'campaign'].includes(s)) {
      return 'badge-purple odv-badge';
    }
    return 'badge-slate odv-badge';
  });

  protected readonly dotClass = computed(() => {
    const s = this.status().toLowerCase();
    if (['active', 'paid', 'completed', 'healthy', 'configured', 'available', 'vip'].includes(s)) {
      return 'bg-emerald-500';
    }
    if (['critical', 'refunded', 'cancelled', 'maintenance', 'error'].includes(s)) {
      return 'bg-rose-500';
    }
    if (['draft', 'partial', 'due', 'review', 'processing', 'pending', 'waiting'].includes(s)) {
      return 'bg-amber-500';
    }
    if (['scheduled', 'in-progress', 'confirmed', 'ready'].includes(s)) {
      return 'bg-sky-500';
    }
    if (['premium', 'campaign'].includes(s)) {
      return 'bg-purple-500';
    }
    return 'bg-slate-400';
  });

  protected readonly label = computed(() => {
    const s = this.status();
    const map: Record<string, string> = {
      active: 'Aktif',
      paid: 'Ödendi',
      completed: 'Tamamlandı',
      ready: 'Hazır',
      healthy: 'Sağlıklı',
      configured: 'Yapılandırıldı',
      available: 'Müsait',
      vip: 'VIP',
      critical: 'Kritik',
      refunded: 'İade Edildi',
      cancelled: 'İptal',
      maintenance: 'Bakımda',
      error: 'Hata',
      draft: 'Taslak',
      partial: 'Kısmi',
      due: 'Vadesi Geldi',
      review: 'İncelemede',
      processing: 'İşleniyor',
      pending: 'Bekliyor',
      waiting: 'Beklemede',
      scheduled: 'Planlandı',
      'in-progress': 'Sürüyor',
      'not-configured': 'Yapılandırılmadı',
      inactive: 'Pasif',
    };
    return map[s.toLowerCase()] || s;
  });
}
