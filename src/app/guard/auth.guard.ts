import { inject } from "@angular/core";
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take } from "rxjs/operators"; // Assurez-vous d'importer 'take'

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

 
  return authService.isAuthenticated$.pipe(
    take(1), // Prenez la première valeur émise et complétez l'observable.
             // Ceci est crucial pour que le guard réagisse une seule fois à la valeur actuelle/suivante.
    map(isAuthenticated => {
      console.log(`AuthGuard : isAuthenticated$ a émis : ${isAuthenticated} pour la route ${state.url}`);
      if (isAuthenticated) {
        // L'utilisateur est authentifié.
        // Vérifions les rôles si la route en spécifie et que l'utilisateur n'est pas ADMIN
        if (route.data?.['roles'] && !authService.isAdmin()) {
          console.warn('AuthGuard : Accès refusé : rôle insuffisant.');
          router.navigate(['/access-denied']); // Rediriger vers une page "Accès Refusé"
          return false; // Bloquer l'accès
        }
        console.log('AuthGuard : Accès accordé.');
        return true; // L'utilisateur est authentifié et autorisé.
      } else {
        // L'utilisateur n'est PAS authentifié. Rediriger vers la page de connexion.
        console.log('AuthGuard : Utilisateur non authentifié. Redirection vers /login.');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false; // Bloquer l'accès
      }
    })
  );
};
