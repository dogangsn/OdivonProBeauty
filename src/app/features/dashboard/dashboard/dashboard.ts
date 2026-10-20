import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { Auth } from '../../../core/auth';
import { BeautyRecord } from '../../../core/beauty.model';
import { KpiCard } from '../../../shared/kpi-card/kpi-card';
import { LiveRadar } from '../../../shared/live-radar/live-radar';
import { PageHeader } from '../../../shared/page-header/page-header';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

interface DashboardSummary {
  appointments: number;
  customers: number;
  revenue: number;
  criticalStock: number;
}

@Component({
  imports: [BaseChartDirective, KpiCard, LiveRadar, PageHeader, RouterLink, StatusBadge],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly api = inject(ApiClient);
  protected readonly auth = inject(Auth);
  protected readonly summary = resource({
    loader: async () =>
      (await firstValueFrom(this.api.request<DashboardSummary>('GET', 'beauty/reports/dashboard')))
        .data,
  });
  protected readonly appointments = resource({
    loader: async () =>
      (
        await firstValueFrom(
          this.api.list<BeautyRecord>('appointments', {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
            limit: 8,
          }),
        )
      ).data,
  });
  protected readonly payments = resource({
    loader: async () =>
      (await firstValueFrom(this.api.list<BeautyRecord>('payments', { limit: 200 }))).data,
  });
  protected readonly activeAppointmentsCount = computed(
    () => (this.appointments.value() ?? []).length,
  );
  protected readonly chartData = computed(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    const rows = this.payments.value() ?? [];
    return {
      labels: days.map((date) =>
        new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date),
      ),
      datasets: [
        {
          data: days.map((date) =>
            rows
              .filter((row) => this.sameDay(row['createdAt'], date))
              .reduce(
                (sum, row) => sum + (typeof row['amount'] === 'number' ? row['amount'] : 0),
                0,
              ),
          ),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,.12)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });
  protected readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.12)' } },
    },
  };
  protected currency(value: number | undefined): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }
  protected count(value: number | undefined): string {
    return String(value ?? 0);
  }
  protected customerName(item: BeautyRecord): string {
    const value = item['customerName'];
    return typeof value === 'string' && value ? value : this.text(item['customerId']) || 'Müşteri';
  }
  protected serviceName(item: BeautyRecord): string {
    const value = item['serviceName'];
    return typeof value === 'string' && value ? value : 'Hizmet bilgisi';
  }
  protected time(item: BeautyRecord): string {
    const value = item['startAt'];
    if (typeof value !== 'string') return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  protected initials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr')
      : parts[0].slice(0, 2).toLocaleUpperCase('tr');
  }
  protected displayName(): string {
    return (
      this.auth.currentUser()?.displayName ||
      this.auth.currentUser()?.email?.split('@')[0] ||
      'Kullanıcı'
    );
  }
  private text(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
  private sameDay(value: unknown, date: Date): boolean {
    if (typeof value !== 'string') return false;
    const other = new Date(value);
    return (
      other.getFullYear() === date.getFullYear() &&
      other.getMonth() === date.getMonth() &&
      other.getDate() === date.getDate()
    );
  }
}
