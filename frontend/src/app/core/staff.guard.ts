import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.user()?.role;
  if (role === 'employee' || role === 'admin') return true;
  return router.createUrlTree(['/sign-in'], { queryParams: { next: '/gallery' } });
};
