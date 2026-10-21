import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Auth } from './core/auth';
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
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'auth/verify-email',
    redirectTo: 'verify-email',
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding').then((m) => m.Onboarding),
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
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports').then((m) => m.Reports),
      },
      ...workspaceRoutes.map(([path, key]) => workspace(path, WORKSPACES[key])),
      {
        path: 'definitions',
        loadComponent: () =>
          import('./features/definitions/definitions/definitions').then((m) => m.Definitions),
      },
      {
        path: 'nail-studio',
        loadComponent: () =>
          import('./features/nail-studio/nail-studio').then((m) => m.NailStudio),
      },
      {
        path: 'purchasing',
        loadComponent: () =>
          import('./features/purchasing/purchasing').then((m) => m.Purchasing),
      },
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
