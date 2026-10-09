import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../core/auth';
import { NavItem } from '../../core/beauty.model';
import { Theme } from '../../core/theme';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(Auth);
  protected readonly theme = inject(Theme);
  protected readonly menuOpen = signal(false);
  protected readonly items: readonly NavItem[] = [
    { label: 'Genel Bakis', icon: '⌂', route: '/dashboard' },
    { label: 'Randevu Takvimi', icon: '◫', route: '/appointments' },
    { label: 'Musteri CRM', icon: '◉', route: '/customers' },
    { label: 'Paket ve Seans', icon: '◇', route: '/sessions' },
    { label: 'Hizmetler', icon: '✦', route: '/catalog' },
    { label: 'Cihaz ve Odalar', icon: '▣', route: '/resources' },
    { label: 'Personel', icon: '♙', route: '/staff' },
    { label: 'Kasa ve Finans', icon: '₺', route: '/finance' },
    { label: 'Stok', icon: '▤', route: '/inventory' },
    { label: 'Kampanyalar', icon: '✧', route: '/campaigns' },
    { label: 'Raporlar', icon: '↗', route: '/reports' },
    { label: 'AI Oneri', icon: '✺', route: '/ai-recommendations' },
    { label: 'Ayarlar', icon: '⚙', route: '/settings' },
  ];
  protected readonly today = computed(() => new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
}
