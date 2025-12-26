import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { retry, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id:  number;
  titre: string;
  message: string;
  type: string;
  lu:  boolean;
  dateCreation: string;
  referenceId?:  number;
  referenceType?: string;
  lienAction?: string;
}

export interface CongeAlertDto {
  id: string;
  type: 'CONGE_COMMENCE_DEMAIN' | 'CONGE_COMMENCE_AUJOURD_HUI' | 'CONGE_EN_COURS' | 'CONGE_SE_TERMINE_AUJOURD_HUI' | 'CONGE_RETOUR';
  titre: string;
  message: string;
  dateDebut: string;
  dateFin: string;
  typeConge: string;
  demandeId: number;
  dureeTotal?:  number;
  jourActuel?: number;
  joursRestants?: number;
  icon:  string;
  colorClass: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private congeApiUrl = `${environment.apiUrl}/api/conge`;

  // Sources de données
  private countSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private congeAlertsSubject = new BehaviorSubject<CongeAlertDto[]>([]);
  private showDropdownSubject = new BehaviorSubject<boolean>(false);
  
  // Gestion du cycle de vie
  private pollingSubscription:  Subscription | null = null;
  private isInitialized = false;

  // Observables publics
  public count$ = this.countSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public congeAlerts$ = this.congeAlertsSubject.asObservable();
  public showDropdown$ = this.showDropdownSubject.asObservable();

  constructor(private http: HttpClient) {}

  initForUser(): void {
    if (this.isInitialized || !this.canReceiveNotifications()) {
      return;
    }

    this.isInitialized = true;
    console.log('NotificationService: Initialisation.. .');
    
    // Lance le polling :  appel immédiat (0ms) puis toutes les 30s
    this.pollingSubscription = timer(0, 30000).subscribe(() => {
      if (this.canReceiveNotifications()) {
        this.refreshAll();
      }
    });
  }

  private refreshAll(): void {
    this.refreshCount();
    this.loadRecentNotifications();
    this.loadCongeAlerts(); // ✅ Calcul local des alertes
  }

  private refreshCount(): void {
    this.http.get<any>(`${this.apiUrl}/count-non-lues`)
      .pipe(retry(1))
      .subscribe({
        next: (response:  any) => {
          const count = typeof response === 'number' ? response : (response.data ??  0);
          this.countSubject.next(count);
        },
        error: (err:  any) => console.error('Erreur count:', err)
      });
  }

  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}?page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response: any) => {
          const list = response.data?. content ?? response.data ??  response.content ??  [];
          this. notificationsSubject.next(list);
        },
        error: (err:  any) => console.error('Erreur notifications:', err)
      });
  }

  /**
   * ✅ Charge les demandes de congés approuvées et génère les alertes localement
   */
  private loadCongeAlerts(): void {
    const role = localStorage.getItem('user_role') || '';
    
    // Seulement pour les employés
    if (role !== 'EMPLOYE') {
      this.congeAlertsSubject.next([]);
      return;
    }

    // Récupérer les congés approuvés via l'API existante
    this. http.get<any>(`${this.congeApiUrl}/mes-demandes`, {
      params: { statut: 'APPROUVEE', size: '50' }
    }).pipe(
      retry(1),
      catchError((err) => {
        console. error('Erreur chargement congés pour alertes:', err);
        return of({ content: [] });
      })
    ).subscribe({
      next: (response: any) => {
        const demandes = response?. content || response?.data?.content || response?.data || [];
        const alerts = this.generateCongeAlerts(demandes);
        this.congeAlertsSubject.next(alerts);
        console.log('🔔 Alertes congés générées:', alerts.length, alerts);
      }
    });
  }

  /**
   * ✅ Génère les alertes à partir des demandes de congés
   */
  private generateCongeAlerts(demandes: any[]): CongeAlertDto[] {
    const alerts: CongeAlertDto[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer les alertes déjà fermées
    const dismissedAlerts = this.getDismissedAlerts();

    demandes.forEach((demande: any) => {
      if (! demande.dateDebut || !demande.dateFin) return;

      const dateDebut = new Date(demande.dateDebut);
      const dateFin = new Date(demande.dateFin);
      dateDebut.setHours(0, 0, 0, 0);
      dateFin.setHours(0, 0, 0, 0);

      const diffDebut = Math.ceil((dateDebut. getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffFin = Math. ceil((dateFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let alert: CongeAlertDto | null = null;

      // 🔔 Congé qui commence DEMAIN
      if (diffDebut === 1) {
        alert = {
          id: `CONGE_COMMENCE_DEMAIN-${demande.id}`,
          type: 'CONGE_COMMENCE_DEMAIN',
          titre: '🔔 Votre congé commence demain ! ',
          message:  'Préparez-vous, votre congé débute demain.',
          dateDebut: demande.dateDebut,
          dateFin: demande. dateFin,
          typeConge:  demande.typeConge,
          demandeId: demande.id,
          icon: 'bi-bell-fill',
          colorClass: 'alert-warning'
        };
      }

      // 🚀 Congé qui commence AUJOURD'HUI
      else if (diffDebut === 0 && diffFin > 0) {
        alert = {
          id: `CONGE_COMMENCE_AUJOURD_HUI-${demande.id}`,
          type: 'CONGE_COMMENCE_AUJOURD_HUI',
          titre: '🚀 Votre congé commence aujourd\'hui !',
          message: 'C\'est le début de votre congé.  Bon repos !',
          dateDebut: demande.dateDebut,
          dateFin: demande.dateFin,
          typeConge: demande.typeConge,
          demandeId: demande.id,
          icon: 'bi-rocket-takeoff-fill',
          colorClass: 'alert-info'
        };
      }

      // 🏖️ Congé EN COURS
      else if (diffDebut < 0 && diffFin > 0) {
        const dureeTotal = Math. ceil((dateFin. getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const jourActuel = Math.abs(diffDebut) + 1;
        alert = {
          id: `CONGE_EN_COURS-${demande. id}`,
          type: 'CONGE_EN_COURS',
          titre: '🏖️ Vous êtes en congé',
          message: `Jour ${jourActuel} sur ${dureeTotal}.  Il vous reste ${diffFin} jour(s).`,
          dateDebut: demande.dateDebut,
          dateFin: demande. dateFin,
          typeConge:  demande.typeConge,
          demandeId: demande.id,
          jourActuel,
          dureeTotal,
          joursRestants: diffFin,
          icon: 'bi-umbrella-fill',
          colorClass: 'alert-success'
        };
      }

      // 🎉 Congé qui SE TERMINE AUJOURD'HUI
      else if (diffFin === 0 && diffDebut <= 0) {
        alert = {
          id: `CONGE_SE_TERMINE_AUJOURD_HUI-${demande.id}`,
          type: 'CONGE_SE_TERMINE_AUJOURD_HUI',
          titre: '🎉 Dernier jour de congé ! ',
          message:  'Votre congé se termine aujourd\'hui. Bon retour demain ! ',
          dateDebut: demande. dateDebut,
          dateFin:  demande.dateFin,
          typeConge: demande.typeConge,
          demandeId: demande. id,
          icon: 'bi-calendar-check-fill',
          colorClass: 'alert-primary'
        };
      }

      // 👋 Congé TERMINÉ HIER (message de retour)
      else if (diffFin === -1) {
        alert = {
          id:  `CONGE_RETOUR-${demande.id}`,
          type: 'CONGE_RETOUR',
          titre: '👋 Bon retour parmi nous !',
          message: 'Votre congé s\'est terminé hier. Bienvenue ! ',
          dateDebut: demande. dateDebut,
          dateFin:  demande.dateFin,
          typeConge: demande.typeConge,
          demandeId: demande. id,
          icon: 'bi-emoji-smile-fill',
          colorClass: 'alert-success'
        };
      }

      // Ajouter l'alerte si elle n'a pas été fermée
      if (alert && !dismissedAlerts.includes(alert.id)) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * ✅ Fermer une alerte de congé (sauvegardé dans localStorage)
   */
  dismissCongeAlert(alertId: string): void {
    // Sauvegarder dans localStorage
    const dismissed = this.getDismissedAlerts();
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId);
      localStorage. setItem('dismissedCongeAlerts', JSON. stringify(dismissed));
    }
    
    // Mettre à jour l'affichage
    const currentAlerts = this.congeAlertsSubject.value;
    this.congeAlertsSubject.next(currentAlerts. filter(a => a.id !== alertId));
  }

  /**
   * ✅ Récupérer les alertes fermées depuis localStorage
   */
  private getDismissedAlerts(): string[] {
    const stored = localStorage.getItem('dismissedCongeAlerts');
    if (! stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * ✅ Réinitialiser les alertes fermées (pour les tests)
   */
  resetDismissedAlerts(): void {
    localStorage.removeItem('dismissedCongeAlerts');
    this.loadCongeAlerts();
  }

  loadAllNotifications(page: number = 0, size: number = 20): Observable<PageResponse<NotificationDto>> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map((response: any) => {
        if (response.data) {
          return {
            content: response.data.content ??  response.data ??  [],
            totalElements:  response.data.totalElements ??  0,
            totalPages: response. data.totalPages ??  0,
            size: response.data.size ?? size,
            number:  response.data.number ?? page
          };
        }
        return {
          content: response.content ?? [],
          totalElements: response.totalElements ?? 0,
          totalPages:  response.totalPages ??  0,
          size: response.size ?? size,
          number: response.number ?? page
        };
      })
    );
  }

  marquerCommeLu(id: number): Observable<any> {
    const currentNotifs = this. notificationsSubject.value;
    const updatedNotifs = currentNotifs.map(n => n.id === id ?  { ...n, lu: true } : n);
    this.notificationsSubject.next(updatedNotifs);
    this.countSubject. next(Math.max(0, this.countSubject. value - 1));

    return this. http.put(`${this.apiUrl}/${id}/marquer-lu`, {});
  }

  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this. notificationsSubject.value;
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
    this.countSubject. next(0);
    this.notificationsSubject.next([]);
    this.congeAlertsSubject.next([]);
  }

  private canReceiveNotifications(): boolean {
    const role = localStorage.getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this.clear();
  }
}