import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take } from "rxjs";




export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject (AuthService);
  const router = inject (Router);


  return authService.isAuthenticated$.pipe (
    take(1),
    map(isAuthenticated => {
      if(isAuthenticated) {
       console.log('NoAuthGuard: L\'utilisateur est authentifié. Redirection vers /dashboard.');
        router.navigate(['/dashboard']);
        return false;
      } else {

        console.log('NoAuthGuard: L\'utilisateur n\'est pas authentifié. Accès autorisé.');
        return true;
      }
    })
  );


}
