import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Auth } from './core/auth';
import { WorkspaceDefinition } from './core/beauty.model';

const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return (await auth.isReadyAndAuthenticated()) ? true : router.parseUrl('/login');
};
const workspace = (path: string, definition: WorkspaceDefinition): Routes[number] => ({
  path,
  loadComponent: () => import('./features/workspace/workspace/workspace').then((m) => m.Workspace),
  data: { definition },
});
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'portal',
    loadComponent: () => import('./features/customer-portal/portal/portal').then((m) => m.Portal),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/calendar/calendar').then((m) => m.Calendar),
      },
      workspace('customers', {
        title: 'Müşteri CRM',
        eyebrow: 'İlişkiler',
        description: 'Sağlık, cilt analizi, onam, segment ve sadakat profilleri.',
        resource: 'customers',
        primaryAction: 'Yeni müşteri',
        columns: ['Müşteri', 'Şube', 'Durum', 'Kayıt'],
        branchRequired: true,
      }),
      workspace('sessions', {
        title: 'Paket ve Seanslar',
        eyebrow: 'Tedavi planı',
        description: 'Kalan seans, sonraki tarih, dondurma ve uygulama notları.',
        resource: 'sessions',
        primaryAction: 'Seans başlat',
        columns: ['Seans', 'Şube', 'Durum', 'Son işlem'],
        branchRequired: true,
      }),
      workspace('catalog', {
        title: 'Hizmet ve Fiyatlandırma',
        eyebrow: 'Katalog',
        description: 'Kategori, süre, KDV, reçete, cihaz ve uzmanlık gereksinimleri.',
        resource: 'services',
        primaryAction: 'Yeni hizmet',
        columns: ['Hizmet', 'Şube', 'Durum', 'Güncelleme'],
        branchRequired: true,
      }),
      workspace('resources', {
        title: 'Cihaz ve Odalar',
        eyebrow: 'Kaynaklar',
        description: 'Kapasite, bakım, kalibrasyon ve kullanım takibi.',
        resource: 'devices',
        primaryAction: 'Cihaz ekle',
        columns: ['Cihaz', 'Şube', 'Durum', 'Bakım'],
        branchRequired: true,
      }),
      workspace('staff', {
        title: 'Personel ve Vardiya',
        eyebrow: 'Ekip',
        description: 'Yetkinlik, vardiya, izin, sertifika ve performans.',
        resource: 'staff',
        primaryAction: 'Personel ekle',
        columns: ['Personel', 'Şube', 'Durum', 'Güncelleme'],
        branchRequired: true,
      }),
      workspace('finance', {
        title: 'Kasa ve Ödemeler',
        eyebrow: 'Finans',
        description: 'Parçalı ödeme, iade, vardiya, fatura ve ertelenmiş gelir.',
        resource: 'payments',
        primaryAction: 'Ödeme al',
        columns: ['İşlem', 'Şube', 'Durum', 'Tarih'],
        branchRequired: true,
      }),
      workspace('inventory', {
        title: 'Stok ve Ürün',
        eyebrow: 'Envanter',
        description: 'Reçete tüketimi, sayım, kritik stok ve tedarikçi işlemleri.',
        resource: 'products',
        primaryAction: 'Ürün ekle',
        columns: ['Ürün', 'Şube', 'Durum', 'Hareket'],
        branchRequired: true,
      }),
      workspace('campaigns', {
        title: 'Kampanya ve İletişim',
        eyebrow: 'Etkileşim',
        description: 'Segment, hatırlatma, geri kazanım ve mesaj şablonları.',
        resource: 'campaigns',
        primaryAction: 'Kampanya oluştur',
        columns: ['Kampanya', 'Şube', 'Durum', 'Plan'],
        branchRequired: true,
      }),
      workspace('reports', {
        title: 'Raporlar',
        eyebrow: 'Analitik',
        description: 'Ciro, doluluk, hizmet, paket, stok ve komisyon analizi.',
        resource: 'reports/dashboard',
        primaryAction: 'Dışarı aktar',
        columns: ['Rapor', 'Değer', 'Durum', 'Dönem'],
        readonly: true,
      }),
      workspace('settings', {
        title: 'Ayarlar ve Yönetim',
        eyebrow: 'Platform',
        description: 'Şube, roller, entegrasyon, KVKK ve audit log ayarları.',
        resource: 'settings',
        primaryAction: 'Ayar ekle',
        columns: ['Ayar', 'Kapsam', 'Durum', 'Güncelleme'],
      }),
      {
        path: 'ai-recommendations',
        loadComponent: () =>
          import('./features/ai/recommendations/recommendations').then((m) => m.Recommendations),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
