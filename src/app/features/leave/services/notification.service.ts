import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/ApiResponse';


export interface NotificationDto {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  dateCreation: string;
  referenceId?: number;
  referenceType?: string;
  lienAction?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;

  // États réactifs pour les notifications
  private countSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private showDropdownSubject = new BehaviorSubject<boolean>(false);
    private pollingSubscription: Subscription | null = null;

  // Observables publics
  public count$ = this.countSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public showDropdown$ = this.showDropdownSubject.asObservable();

  constructor(private http: HttpClient) {

  }

  /**
   * Initialise le polling pour récupérer les notifications périodiquement
   */
  private initPolling() {
    // Polling toutes les 30 secondes pour les nouvelles notifications
    interval(30000).subscribe(() => {
      this.refreshCount();
      this.loadRecentNotifications();
    });
  }
  private canReceiveNotifications(): boolean {
  const role = localStorage.getItem('user_role');
  return role === 'EMPLOYE' || role === 'EMPLOYEUR';
}

  /**
   * Charge les notifications récentes
   */
loadRecentNotifications(): Observable<any> {
  if (!this.canReceiveNotifications()) {
    return new Observable(subscriber => subscriber.complete());
  }
  const request = this.http.get<any>(`${this.apiUrl}?page=0&size=10`);
  request.subscribe(
    response => {
      // Adapter à votre structure ApiResponse backend
      if (response.data && response.data.content) {
        this.notificationsSubject.next(response.data.content);
      }
    },
    error => console.error('Erreur lors du chargement des notifications:', error)
  );
  return request;
}

refreshCount(): Observable<any> {
   if (!this.canReceiveNotifications()) {
    this.countSubject.next(0);
    return new Observable(subscriber => subscriber.complete());
  }
  const request = this.http.get<any>(`${this.apiUrl}/count-non-lues`);
  request.subscribe(
    response => {
      // Adapter à votre structure ApiResponse backend
      if (response.data !== null && response.data !== undefined) {
        this.countSubject.next(response.data);
      }
    },
    error => console.error('Erreur lors du chargement du count:', error)
  );
  return request;
}

  /**
   * Marque une notification comme lue
   */
  marquerCommeLu(id: number): Observable<any> {
    const request = this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {});
    request.subscribe(
      () => {
        // Mise à jour locale
        const currentNotifs = this.notificationsSubject.value;
        const updatedNotifs = currentNotifs.map(n =>
          n.id === id ? { ...n, lu: true } : n
        );
        this.notificationsSubject.next(updatedNotifs);

        // Décrémenter le count
        const currentCount = this.countSubject.value;
        this.countSubject.next(Math.max(0, currentCount - 1));
      }
    );
    return request;
  }

  /**
   * Marque toutes les notifications comme lues
   */
  marquerToutesCommeLues(): Observable<any> {
    const request = this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {});
    request.subscribe(
      () => {
        // Mise à jour locale
        const currentNotifs = this.notificationsSubject.value;
        const updatedNotifs = currentNotifs.map(n => ({ ...n, lu: true }));
        this.notificationsSubject.next(updatedNotifs);
        this.countSubject.next(0);
      }
    );
    return request;
  }

  /**
   * Toggle du dropdown
   */
  toggleDropdown() {
    this.showDropdownSubject.next(!this.showDropdownSubject.value);
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown() {
    this.showDropdownSubject.next(false);
  }

  /**
   * Initialise les notifications pour un utilisateur connecté
   */
  initForUser() {
    console.log('NotificationService: Initialisation pour utilisateur');
    if (this.canReceiveNotifications()) {
      console.log('NotificationService: Utilisateur autorisé, chargement initial...');
      this.refreshCount();
      this.loadRecentNotifications();
      this.initPolling(); // ✅ Démarrer le polling seulement maintenant
    } else {
      console.log('NotificationService: Utilisateur non autorisé');
      this.clear();
    }
  }

  /**
   * Nettoie les notifications lors de la déconnexion
   */
   clear() {
    console.log('NotificationService: Nettoyage des notifications');

    // Arrêter le polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }

    this.countSubject.next(0);
    this.notificationsSubject.next([]);
    this.closeDropdown();
  }

  loadAllNotifications(page = 0, size = 20): Observable<ApiResponse<any>> {
  if (!this.canReceiveNotifications()) {
    return new Observable(subscriber => subscriber.complete());
  }

  console.log(`NotificationService: Chargement historique page ${page}, size ${size}`);
  return this.http.get<ApiResponse<any>>(`${this.apiUrl}?page=${page}&size=${size}`);
}




}
