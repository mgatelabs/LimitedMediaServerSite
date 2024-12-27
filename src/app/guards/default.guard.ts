import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const defaultGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // User is logged in, redirect to /a-dash
    router.navigate(['/a-dash']);
  } else {
    // User is not logged in, redirect to /a-login
    router.navigate(['/a-login']);
  }
  return false; // Prevent direct access to the route
};