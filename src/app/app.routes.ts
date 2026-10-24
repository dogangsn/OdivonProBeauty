import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Auth } from './core/auth';
import { subscriptionGuard } from './core/subscription/subscription.guard';
import { WorkspaceDefinition } from './core/beauty.model';
import { WORKSPACES } from './core/workspace-definitions';

const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return (await auth.isReadyAndAuthenticated()) ? true : router.parseUrl('/login');
};
const workspace = (path: string, definition: WorkspaceDefinition): Routes[number] => ({
  path,
  loadComponent: () => import('./features/workspace/workspace/workspace').then((m) => m.Workspace),
  title: definition.title,
  data: { definition },
});
const workspaceRoutes = [
  ['customers', 'customers'],
  ['consultations', 'consultations'],
  ['customer-health', 'health'],
  ['consents', 'consents'],
  ['services', 'services'],
  ['service-categories', 'categories'],
  ['service-packages', 'packageCatalog'],
  ['packages', 'packages'],
  ['sessions', 'sessions'],
  ['devices', 'devices'],
  ['rooms', 'rooms'],
  ['staff', 'staff'],
  ['shifts', 'shifts'],
  ['time-off', 'timeOff'],
  ['payments', 'payments'],
  ['invoices', 'invoices'],
  ['expenses', 'expenses'],
  ['products', 'products'],
  ['inventory-transactions', 'inventory'],
  ['suppliers', 'suppliers'],
  ['commissions', 'commissions'],
  ['campaigns', 'campaigns'],
  ['waitlist', 'waitlist'],
  ['audit-logs', 'audit'],
  ['settings', 'settings'],
] as const;

export const routes: Routes = [
  {
    path: 'login',
    title: 'Giriş yap',
    data: {
      indexable: true,
      description:
        'OdivonPro Beauty yönetim paneline giriş yapın. Randevu, müşteri, seans, kasa ve stok yönetimi tek ekranda.',
    },
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: '14 gün ücretsiz deneyin',
    data: {
      indexable: true,
      description:
        'Güzellik merkeziniz için OdivonPro Beauty hesabınızı birkaç dakikada oluşturun. 14 gün ücretsiz, kredi kartı gerekmez.',
    },
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'verify-email',
    title: 'E-posta doğrulama',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'auth/verify-email',
    redirectTo: 'verify-email',
  },
  {
    path: 'onboarding',
    title: 'Kurulum sihirbazı',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding').then((m) => m.Onboarding),
  },
  {
    path: 'portal',
    title: 'Müşteri portalı',
    data: {
      indexable: true,
      description:
        'Güzellik merkezinizdeki randevularınızı, paketlerinizi ve kalan seanslarınızı telefon numaranızla güvenle görüntüleyin.',
    },
    loadComponent: () => import('./features/customer-portal/portal/portal').then((m) => m.Portal),
  },
  {
    path: 'pay/:linkId',
    title: 'Güvenli ödeme',
    loadComponent: () =>
      import('./features/payment-links/public-checkout/public-checkout').then(
        (m) => m.PublicCheckout,
      ),
  },
  {
    path: 'terms',
    title: 'Kullanım Şartları',
    data: {
      indexable: true,
      description:
        'OdivonPro Beauty bulut yazılımının kullanım şartları: abonelik, deneme süresi, ödeme, veri sahipliği ve sorumluluklar.',
    },
    loadComponent: () => import('./features/legal/terms').then((m) => m.Terms),
  },
  {
    path: 'privacy',
    title: 'Gizlilik Politikası ve KVKK',
    data: {
      indexable: true,
      description:
        'OdivonPro Beauty KVKK aydınlatma metni: hangi kişisel verileri, hangi amaçla işlediğimiz, aktarım, saklama ve haklarınız.',
    },
    loadComponent: () => import('./features/legal/privacy').then((m) => m.Privacy),
  },
  {
    path: 'cookies',
    title: 'Çerez Politikası',
    data: {
      indexable: true,
      description:
        'OdivonPro Beauty çerez politikası: zorunlu ve analitik çerezler, süreleri ve tercihlerinizi nasıl değiştireceğiniz.',
    },
    loadComponent: () => import('./features/legal/cookies').then((m) => m.Cookies),
  },
  { path: 'kullanim-sartlari', redirectTo: 'terms' },
  { path: 'gizlilik-politikasi', redirectTo: 'privacy' },
  { path: 'kvkk', redirectTo: 'privacy' },
  { path: 'cerez-politikasi', redirectTo: 'cookies' },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [subscriptionGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'subscription',
        title: 'Abonelik',
        loadComponent: () =>
          import('./features/subscription/subscription').then((m) => m.Subscription),
      },
      {
        path: 'dashboard',
        title: 'Panel',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'appointments',
        title: 'Randevular',
        loadComponent: () =>
          import('./features/appointments/calendar/calendar').then((m) => m.Calendar),
      },
      {
        path: 'reports',
        title: 'Raporlar',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      ...workspaceRoutes.map(([path, key]) => workspace(path, WORKSPACES[key])),
      {
        path: 'definitions',
        title: 'Tanımlar',
        loadComponent: () =>
          import('./features/definitions/definitions/definitions').then((m) => m.Definitions),
      },
      {
        path: 'nail-studio',
        title: 'Tırnak stüdyosu',
        loadComponent: () => import('./features/nail-studio/nail-studio').then((m) => m.NailStudio),
      },
      {
        path: 'purchasing',
        title: 'Satın alma',
        loadComponent: () => import('./features/purchasing/purchasing').then((m) => m.Purchasing),
      },
      {
        path: 'payment-links',
        title: 'Ödeme bağlantıları',
        loadComponent: () =>
          import('./features/payment-links/payment-links').then((m) => m.PaymentLinks),
      },
      {
        path: 'sms-settings',
        title: 'SMS ayarları',
        loadComponent: () =>
          import('./features/sms-settings/sms-settings').then((m) => m.SmsSettings),
      },
      {
        path: 'ai-recommendations',
        title: 'Yapay zekâ önerileri',
        loadComponent: () =>
          import('./features/ai/recommendations/recommendations').then((m) => m.Recommendations),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: '**',
    title: 'Sayfa bulunamadı',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
