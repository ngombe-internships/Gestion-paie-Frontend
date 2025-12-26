import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface NotificationDto {
  id:  number;
  titre: string;
  message: string;
  type: string;
  lu:  boolean;
  dateCreation: string;
  referenceId?: number;
  referenceType?: string;
  lienAction?: string;
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
      console.log('NotificationService: Déjà initialisé, skip');
      return;
    }

    if (!this.canReceiveNotifications()) {
      console.log('NotificationService:  Utilisateur non autorisé');
      return;
    }

    this.isInitialized = true;
    console.log('NotificationService: Initialisation.. .');
    
    // Lance le polling : Appel immédiat (0ms) puis toutes les 30s
    this.pollingSubscription = timer(0, 30000).subscribe(() => {
      if (this.canReceiveNotifications()) {
        this. refreshAll();
      }
    });
  }

  /**
   * Rafraîchit toutes les données
   */
  private refreshAll(): void {
    this.refreshCount();
    this.loadRecentNotifications();
  }

  /**
   * Rafraîchit le compteur de notifications non lues
   */
  private refreshCount(): void {
    this.http.get<any>(`${this.apiUrl}/count-non-lues`)
      .pipe(retry(1))
      .subscribe({
        next:  (response) => {
          // Gestion flexible si le backend renvoie un objet ou un nombre
          const count = typeof response === 'number' ? response : (response.data ?? 0);
          console.log('NotificationService: Count =', count);
          this.countSubject.next(count);
        },
        error: (err) => console.error('NotificationService: Erreur count:', err)
      });
  }

  /**
   * Charge les notifications récentes
   */
  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}?page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response) => {
          const list = response. data?.content ?? response.data ?? response.content ?? [];
          console.log('NotificationService: Notifications chargées:', list.length);
          this.notificationsSubject.next(list);
        },
        error:  (err) => console.error('NotificationService: Erreur notifications:', err)
      });
  }

  /**
   * Marque une notification comme lue (Optimistic UI update)
   */
  marquerCommeLu(id: number): Observable<any> {
    // Optimistic UI update :  on met à jour l'interface AVANT la réponse serveur
    const currentNotifs = this.notificationsSubject. value;
    const updatedNotifs = currentNotifs.map(n => n. id === id ? { ...n, lu: true } : n);
    this.notificationsSubject. next(updatedNotifs);
    this.countSubject. next(Math.max(0, this. countSubject.value - 1));

    return this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {});
  }

  /**
   * Marque toutes les notifications comme lues (Optimistic UI update)
   */
  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this.notificationsSubject. value;
    this.notificationsSubject.next(currentNotifs.map(n => ({ ...n, lu: true })));
    this.countSubject.next(0);

    return this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {});
  }

  /**
   * Toggle du dropdown
   */
  toggleDropdown(): void {
    this.showDropdownSubject. next(!this.showDropdownSubject. value);
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown(): void {
    this.showDropdownSubject.next(false);
  }

  /**
   * Nettoie tout proprement (appelé à la déconnexion)
   */
  clear(): void {
    console.log('NotificationService: Nettoyage');
    this.isInitialized = false;
    
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    
    this.countSubject.next(0);
    this.notificationsSubject.next([]);
    this.closeDropdown();
  }

  /**
   * Vérifie si l'utilisateur peut recevoir des notifications
   */
  private canReceiveNotifications(): boolean {
    const role = localStorage. getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this. clear();
  }
}