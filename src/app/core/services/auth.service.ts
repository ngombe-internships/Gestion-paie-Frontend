import { ApiResponse } from './../model/ApiResponse';
// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginDto } from '../model/loginDto'; // Assuming you create these interfaces
import { RegisterDto } from '../model/registerDto'; // Assuming you create these interfaces
import { environment } from '../../environment';
import { RegisterEmployeeDto } from '../model/registerEmployeeDto';
import { NotificationService } from '../conges/services/notification.service';

// Interfaces pour les DTOs front-end (à créer si ce n'est pas déjà fait)
export interface LoginResponse {
  token: string;
  type: string; // "Bearer"
  username: string;
  role: string;
  displayName : string;
  entrepriseId?: number;
}

interface ChangePasswordPayload {

  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface PasswordResetRequestDto {
  emailOrUsername: string;
}

interface PasswordResetDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}




@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl + '/api/auth'; // Assurez-vous d'avoir environment.ts configuré
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);


  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.loggedIn.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(localStorage.getItem('user_role'))
  userRole$ = this.userRoleSubject.asObservable();

  private displayNameSubject = new BehaviorSubject<string | null>(localStorage.getItem('displayName'));
  displayName$ = this.displayNameSubject.asObservable();

 private entrepriseIdSubject = new BehaviorSubject<number | null>(null);
  entrepriseId$ = this.entrepriseIdSubject.asObservable();


  constructor() {
    console.log('AuthService constructor appelé. État initial de loggedIn:', this.loggedIn.getValue());
    this.isAuthenticated$.subscribe(state => {
      console.log('AuthService - isAuthenticated$ a émis:', state);
    });

    const storedEntrepriseId = localStorage.getItem('entreprise_id');
    if (storedEntrepriseId) {
      this.entrepriseIdSubject.next(parseInt(storedEntrepriseId,10));
    }
   }

  private hasToken(): boolean {
    return !!localStorage.getItem('jwt_token');
  }


  login(credentials: LoginDto): Observable<ApiResponse<LoginResponse>> {
    console.log('AuthsService - login() appele pour', credentials.username);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {

          if (response.data && response.data.token) {
            localStorage.setItem('jwt_token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('user_role', response.data.role); // Stocker le rôle
            localStorage.setItem('displayName',response.data.displayName);

            if(response.data.entrepriseId){
              localStorage.setItem('entreprise_id', response.data.entrepriseId.toString());
              this.entrepriseIdSubject.next(response.data.entrepriseId);
            }else {
              localStorage.removeItem('entreprise_id');
              this.entrepriseIdSubject.next(null);
            }

            this.loggedIn.next(true);
            this.userRoleSubject.next(response.data.role);
            this.displayNameSubject.next(response.data.displayName);
            if (response.data.role === 'EMPLOYE' || response.data.role === 'EMPLOYEUR') {
                   setTimeout(() => {
                    this.notificationService.initForUser();
               }, 1000); // Petit délai pour s'assurer que le token est bien stocké
            }
          }
        }),
        catchError(this.handleError)
      );
  }

  // registerEmployer(credentials: RegisterDto): Observable<ApiResponse<any>> {
  //   const dataToSend = {
  //     username: credentials.username,
  //     password: credentials.password,
  //     employeId: null,
  //     nomEntreprise: credentials.nomEntreprise,
  //     adresseEntreprise: credentials.adresseEntreprise,
  //     telephoneEntreprise: credentials.telephoneEntreprise,
  //     emailEntreprise: credentials.emailEntreprise,
  //     numeroSiret: credentials.numeroSiret,
  //     dateCreation:credentials.dateCreation

  //   };
  //    const token = this.getToken();
  //    const headers = {
  //   'Authorization': `Bearer ${token}`,
  //   'Content-Type': 'application/json'
  // };
  //   return this.http.post<ApiResponse<any>>(`${this.baseUrl}/register/employer-company`, dataToSend)
  //      .pipe(
  //       catchError(this.handleError)
  //      );
  // }


  register(userData: RegisterEmployeeDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/register/employee`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }


  registerEmployerCompany(formData: FormData): Observable<ApiResponse<string>> {
    // Notez qu'on n'a pas besoin de définir Content-Type ici, HttpClient le fait automatiquement
    // pour les requêtes FormData.
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/register/employer-company`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }




  logout(): void {
    this.notificationService.clear();
    localStorage.clear();
    this.loggedIn.next(false);
    this.userRoleSubject.next(null);
    this.displayNameSubject.next(null);
    this.entrepriseIdSubject.next(null);

  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  getDisplayName(): string | null {
    return localStorage.getItem('displayName');
  }

  getEntrepriseId(): number | null {
    const id = localStorage.getItem('entreprise_id');
    return id? parseInt(id, 10) : null;
  }

   hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }


  // Vérifie si l'utilisateur connecté a le rôle 'ADMIN'
  isAdmin(): boolean {
    return this.getUserRole() === 'ROLE_ADMIN';
   }

  isLoggedIn(): boolean {
    return this.loggedIn.getValue();
  }


  changePassword(payload: ChangePasswordPayload): Observable<ApiResponse<string>>{
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/change-password`,payload);
  }


  passwordResetRequest(emailOrUsername: string):Observable<ApiResponse<string>>{

    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/password-reset-request`,{emailOrUsername})
    .pipe(
      catchError((error: HttpErrorResponse) =>{
        if(error.status ===429) {
          return throwError(()=> ({
            status:429,
            message: error.error?.error || 'Trop de tentatives. Veuillez réessayer plus tard'
          }));
        }
        return throwError(() => error)
      })
    );
  }



  resetPassword(resetDto: PasswordResetDto):Observable<ApiResponse<string>>{
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/password-reset`, resetDto);
    }








  private handleError(error: HttpErrorResponse) {
  let errorMessage = 'Une erreur inconnue est survenue.';
  if (error.error instanceof ErrorEvent) {
    errorMessage = `Erreur: ${error.error.message}`;
  } else {
    // Gestion des erreurs backend
    if (error.status === 400 && error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      // <-- Ici tu dois vérifier le message du backend
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = 'Identifiants invalides. Veuillez vérifier votre nom d\'utilisateur et votre mot de passe.';
      }
    } else if (error.status === 403) {
      errorMessage = error.error?.message || 'Votre compte a été désactivé ou vous n\'êtes pas autorisé à accéder à cette ressource.';
    } else {
      errorMessage = error.error?.message || `Erreur de serveur: ${error.status} ${error.statusText || ''}`;
    }
  }
  console.error(errorMessage);
  return throwError(() => ({ ...error, message: errorMessage })); // <-- Ajoute le message personnalisé à l'objet d'erreur renvoyé
}

}


