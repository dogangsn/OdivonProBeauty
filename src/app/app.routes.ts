import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { Auth } from './core/auth';
import { WorkspaceDefinition } from './core/beauty.model';

const authGuard: CanActivateFn = () => inject(Auth).authenticated();
const workspace = (path: string, definition: WorkspaceDefinition): Routes[number] => ({
  path,
  loadComponent: () => import('./features/workspace/workspace/workspace').then((m) => m.Workspace),
  data: { definition },
});
const demo = (prefix: string, statuses: readonly string[]) => statuses.map((status, index) => ({
  id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
  name: ['Ayse Demir', 'Lazer Epilasyon', 'Lotus Uzmani'][index % 3],
  branchId: index % 2 ? 'br-besiktas' : 'br-nisantasi',
  status,
  createdAt: `2026-10-${String(10 - index).padStart(2, '0')}T09:00:00Z`,
}));

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.Login) },
  { path: 'portal', loadComponent: () => import('./features/customer-portal/portal/portal').then((m) => m.Portal) },
  {
    path: '', canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'appointments', loadComponent: () => import('./features/appointments/calendar/calendar').then((m) => m.Calendar) },
      workspace('customers', { title: 'Musteri CRM', eyebrow: 'Iliskiler', description: 'Saglik, cilt analizi, onam, segment ve sadakat profilleri.', resource: 'customers', primaryAction: 'Yeni musteri', columns: ['Musteri', 'Sube', 'Durum', 'Kayit'], demoRows: demo('cus', ['active', 'vip', 'review']) }),
      workspace('sessions', { title: 'Paket ve Seanslar', eyebrow: 'Tedavi plani', description: 'Kalan seans, sonraki tarih, donma ve uygulama notlari.', resource: 'sessions', primaryAction: 'Seans baslat', columns: ['Paket', 'Sube', 'Durum', 'Son islem'], demoRows: demo('ses', ['in-progress', 'due', 'completed']) }),
      workspace('catalog', { title: 'Hizmet ve Fiyatlandirma', eyebrow: 'Katalog', description: 'Kategori, sure, KDV, recete, cihaz ve uzmanlik gereksinimleri.', resource: 'services', primaryAction: 'Yeni hizmet', columns: ['Hizmet', 'Sube', 'Durum', 'Guncelleme'], demoRows: demo('svc', ['active', 'campaign', 'draft']) }),
      workspace('resources', { title: 'Cihaz ve Odalar', eyebrow: 'Kaynaklar', description: 'Kapasite, bakim, kalibrasyon ve kullanim takibi.', resource: 'devices', primaryAction: 'Kaynak ekle', columns: ['Kaynak', 'Sube', 'Durum', 'Bakim'], demoRows: demo('dev', ['available', 'maintenance', 'calibration']) }),
      workspace('staff', { title: 'Personel ve Vardiya', eyebrow: 'Ekip', description: 'Yetkinlik, vardiya, izin, sertifika ve performans.', resource: 'staff', primaryAction: 'Personel ekle', columns: ['Personel', 'Sube', 'Durum', 'Guncelleme'], demoRows: demo('stf', ['active', 'time-off', 'training']) }),
      workspace('finance', { title: 'Kasa ve Odemeler', eyebrow: 'Finans', description: 'Parcali odeme, iade, vardiya, fatura ve ertelenmis gelir.', resource: 'payments', primaryAction: 'Odeme al', columns: ['Islem', 'Sube', 'Durum', 'Tarih'], demoRows: demo('pay', ['paid', 'partial', 'refunded']) }),
      workspace('inventory', { title: 'Stok ve Urun', eyebrow: 'Envanter', description: 'Recete tuketimi, sayim, kritik stok ve tedarikci islemleri.', resource: 'products', primaryAction: 'Urun ekle', columns: ['Urun', 'Sube', 'Durum', 'Hareket'], demoRows: demo('prd', ['healthy', 'critical', 'counting']) }),
      workspace('campaigns', { title: 'Kampanya ve Iletisim', eyebrow: 'Etkilesim', description: 'Segment, hatirlatma, geri kazanim ve mesaj sablonlari.', resource: 'campaigns', primaryAction: 'Kampanya olustur', columns: ['Kampanya', 'Sube', 'Durum', 'Plan'], demoRows: demo('cmp', ['scheduled', 'draft', 'completed']) }),
      workspace('reports', { title: 'Raporlar', eyebrow: 'Analitik', description: 'Ciro, doluluk, hizmet, paket, stok ve komisyon analizi.', resource: 'reports/dashboard', primaryAction: 'Disari aktar', columns: ['Rapor', 'Sube', 'Durum', 'Donem'], demoRows: demo('rpt', ['ready', 'ready', 'processing']) }),
      workspace('settings', { title: 'Ayarlar ve Yonetim', eyebrow: 'Platform', description: 'Sube, roller, entegrasyon, KVKK ve audit log ayarlari.', resource: 'settings', primaryAction: 'Ayarlari guncelle', columns: ['Ayar', 'Sube', 'Durum', 'Guncelleme'], demoRows: demo('set', ['configured', 'not-configured', 'review']) }),
      { path: 'ai-recommendations', loadComponent: () => import('./features/ai/recommendations/recommendations').then((m) => m.Recommendations) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
