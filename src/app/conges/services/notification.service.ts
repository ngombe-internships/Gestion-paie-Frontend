import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { retry, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id: number;
  titre:  string;
  message: string;
  type: string;
  lu:  boolean;
  dateCreation: string;
  referenceId?: number;
  referenceType?: string;
  lienAction?: string;
}

// Interface pour la pagination
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages:  number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/api/notifications`;

  // Sources de données
  private countSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private showDropdownSubject = new BehaviorSubject<boolean>(false);
  
  // Gestion du cycle de vie
  private pollingSubscription:  Subscription | null = null;
  private isInitialized = false;

  // Observables publics pour les composants
  public count$ = this.countSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public showDropdown$ = this.showDropdownSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Appelé par le composant quand l'utilisateur est connecté
   */
  initForUser(): void {
    if (this.isInitialized) {
      return;
    }

    if (!this.canReceiveNotifications()) {
      return;
    }

    this.isInitialized = true;
    console.log('NotificationService: Initialisation.. .');
    
    // Lance le polling :  Appel immédiat (0ms) puis toutes les 30s
    this.pollingSubscription = timer(0, 30000).subscribe(() => {
      if (this.canReceiveNotifications()) {
        this.refreshAll();
      }
    });
  }

  private refreshAll(): void {
    this.refreshCount();
    this.loadRecentNotifications();
  }

  private refreshCount(): void {
    this.http.get<any>(`${this.apiUrl}/count-non-lues`)
      .pipe(retry(1))
      .subscribe({
        next: (response:  any) => {
          const count = typeof response === 'number' ? response : (response. data ?? 0);
          this.countSubject.next(count);
        },
        error: (err: any) => console.error('Erreur count:', err)
      });
  }

  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}? page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response: any) => {
          const list = response. data?.content ?? response.data ?? response. content ?? [];
          this.notificationsSubject.next(list);
        },
        error: (err: any) => console.error('Erreur notifications:', err)
      });
  }

  /**
   * Charge toutes les notifications avec pagination (pour l'historique)
   */
  loadAllNotifications(page: number = 0, size:  number = 20): Observable<PageResponse<NotificationDto>> {
    return this. http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map((response: any) => {
        // Gérer différentes structures de réponse
        if (response. data) {
          return {
            content: response.data. content ?? response.data ??  [],
            totalElements: response.data. totalElements ?? 0,
            totalPages: response.data. totalPages ?? 0,
            size:  response.data.size ?? size,
            number: response.data.number ?? page
          };
        }
        return {
          content: response. content ?? [],
          totalElements: response. totalElements ?? 0,
          totalPages: response.totalPages ?? 0,
          size: response. size ?? size,
          number: response. number ?? page
        };
      })
    );
  }

  marquerCommeLu(id: number): Observable<any> {
    // Optimistic UI update
    const currentNotifs = this.notificationsSubject.value;
    const updatedNotifs = currentNotifs.map(n => n.id === id ? { ...n, lu: true } :  n);
    this.notificationsSubject.next(updatedNotifs);
    this.countSubject.next(Math.max(0, this.countSubject.value - 1));

    return this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {});
  }

  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this.notificationsSubject. value;
    this.notificationsSubject.next(currentNotifs.map(n => ({ ...n, lu: true })));
    this.countSubject.next(0);

    return this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {});
  }

  toggleDropdown(): void {
    this.showDropdownSubject. next(!this.showDropdownSubject. value);
  }

  closeDropdown(): void {
    this.showDropdownSubject.next(false);
  }

  clear(): void {
    console. log('NotificationService: Nettoyage');
    this.isInitialized = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.countSubject.next(0);
    this.notificationsSubject. next([]);
  }

  private canReceiveNotifications(): boolean {
    const role = localStorage. getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this. clear();
  }
}