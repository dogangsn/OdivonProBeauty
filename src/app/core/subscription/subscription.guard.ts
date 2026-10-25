import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionService } from './subscription.service';

export const subscriptionGuard: CanActivateFn = (_route, state) => {
  const subscription = inject(SubscriptionService);
  const router = inject(Router);

  if (subscription.isLocked()) {
    // Subscription and support stay reachable so a locked customer can still ask for help.
    if (state.url.startsWith('/subscription') || state.url.startsWith('/support')) {
      return true;
    }
    // Otherwise redirect to /subscription paywall
    return router.parseUrl('/subscription');
  }

  return true;
};
