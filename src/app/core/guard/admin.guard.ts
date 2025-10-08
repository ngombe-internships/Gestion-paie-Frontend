// src/app/guard/admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Utilisez l'observable isAuthenticated$ et le rôle pour décider
  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (isAuthenticated && authService.isAdmin()) {
        return true; // L'utilisateur est connecté et est ADMIN
      } else {
        // Rediriger vers la page de connexion ou une page d'accès refusé
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false; // L'accès est refusé
      }
    })
  );
};
