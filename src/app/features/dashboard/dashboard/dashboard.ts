import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { KpiCard } from '../../../shared/kpi-card/kpi-card';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

@Component({
  imports: [BaseChartDirective, KpiCard, RouterLink, StatusBadge],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly chartData = {
    labels: ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'],
    datasets: [{ data: [42, 55, 48, 72, 66, 84, 61], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.12)', fill: true, tension: .4 }],
  };
  protected readonly chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { display: false } } };
}
