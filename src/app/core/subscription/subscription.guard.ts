import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionService } from './subscription.service';

export const subscriptionGuard: CanActivateFn = (_route, state) => {
  const subscription = inject(SubscriptionService);
  const router = inject(Router);

  if (subscription.isLocked()) {
    // If user is already heading to /subscription, allow it
    if (state.url.startsWith('/subscription')) {
      return true;
    }
    // Otherwise redirect to /subscription paywall
    return router.parseUrl('/subscription');
  }

  return true;
};
