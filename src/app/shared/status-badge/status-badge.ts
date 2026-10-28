import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<string>();

  protected readonly badgeClass = computed(() => {
    const s = this.status().toLowerCase();
    if (['active', 'paid', 'completed', 'done', 'healthy', 'configured', 'available', 'vip', 'low', 'dusuk', 'signed'].includes(s)) {
      return 'badge-emerald odv-badge';
    }
    if (['critical', 'refunded', 'cancelled', 'maintenance', 'error', 'high', 'yuksek', 'revoked', 'expired', 'unpaid', 'no_show', 'no-show'].includes(s)) {
      return 'badge-rose odv-badge';
    }
    if (['draft', 'partial', 'due', 'review', 'processing', 'pending', 'waiting', 'medium', 'orta'].includes(s)) {
      return 'badge-amber odv-badge';
    }
    if (['scheduled', 'in-progress', 'in_progress', 'confirmed', 'ready', 'frozen'].includes(s)) {
      return 'badge-sky odv-badge';
    }
    if (['premium', 'campaign'].includes(s)) {
      return 'badge-purple odv-badge';
    }
    return 'badge-slate odv-badge';
  });

  protected readonly dotClass = computed(() => {
    const s = this.status().toLowerCase();
    if (['active', 'paid', 'completed', 'done', 'healthy', 'configured', 'available', 'vip', 'low', 'dusuk', 'signed'].includes(s)) {
      return 'bg-emerald-500';
    }
    if (['critical', 'refunded', 'cancelled', 'maintenance', 'error', 'high', 'yuksek', 'revoked', 'expired', 'unpaid', 'no_show', 'no-show'].includes(s)) {
      return 'bg-rose-500';
    }
    if (['draft', 'partial', 'due', 'review', 'processing', 'pending', 'waiting', 'medium', 'orta'].includes(s)) {
      return 'bg-amber-500';
    }
    if (['scheduled', 'in-progress', 'in_progress', 'confirmed', 'ready', 'frozen'].includes(s)) {
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
      done: 'Tamamlandı',
      ready: 'Hazır',
      healthy: 'Sağlıklı',
      configured: 'Yapılandırıldı',
      available: 'Müsait',
      vip: 'VIP',
      low: 'Düşük Risk',
      dusuk: 'Düşük Risk',
      medium: 'Orta Risk',
      orta: 'Orta Risk',
      high: 'Yüksek Risk',
      yuksek: 'Yüksek Risk',
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
      in_progress: 'Uygulanıyor',
      'not-configured': 'Yapılandırılmadı',
      inactive: 'Pasif',
      signed: 'İmzalandı',
      revoked: 'Geri Çekildi / İptal',
      expired: 'Süresi Doldu',
      frozen: 'Donduruldu',
      unpaid: 'Ödenmedi',
      no_show: 'Gelmedi',
      'no-show': 'Gelmedi',
    };
    return map[s.toLowerCase()] || s;
  });
}
