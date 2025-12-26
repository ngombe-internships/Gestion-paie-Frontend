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
  lu: boolean;
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
  demandeId:  number;
  dureeTotal?:  number;
  jourActuel?: number;
  joursRestants?: number;
  icon:  string;
  colorClass: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages:  number;
  size: number;
  number: number;
}

// ✅ Clé localStorage pour les alertes fermées
const DISMISSED_ALERTS_KEY = 'maalipo_dismissed_conge_alerts';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private congeApiUrl = `${environment.apiUrl}/api/conge`;
  private employeApiUrl = `${environment.apiUrl}/api/employes`;

  private countSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private congeAlertsSubject = new BehaviorSubject<CongeAlertDto[]>([]);
  private showDropdownSubject = new BehaviorSubject<boolean>(false);
  
  private pollingSubscription: Subscription | null = null;
  private isInitialized = false;
  private cachedEmployeId: number | null = null;

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
    
    // Nettoyer les anciennes alertes fermées au démarrage
    this.cleanupOldDismissedAlerts();
    
    // Polling toutes les 30 secondes
    this.pollingSubscription = timer(0, 30000).subscribe(() => {
      if (this.canReceiveNotifications()) {
        this.refreshAll();
      }
    });
  }

  private refreshAll(): void {
    this.refreshCount();
    this.loadRecentNotifications();
    this.loadCongeAlerts();
  }

  private refreshCount(): void {
    this.http.get<any>(`${this.apiUrl}/count-non-lues`)
      .pipe(retry(1))
      .subscribe({
        next: (response:  any) => {
          const count = typeof response === 'number' ? response : (response. data ??  0);
          this.countSubject.next(count);
        },
        error: () => {}
      });
  }

  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}?page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response: any) => {
          const list = response.data?. content ??  response.data ??  response. content ??  [];
          this. notificationsSubject.next(list);
        },
        error: () => {}
      });
  }

  private loadCongeAlerts(): void {
    const role = localStorage.getItem('user_role') || '';
    
    if (role !== 'EMPLOYE') {
      this.congeAlertsSubject. next([]);
      return;
    }

    if (this.cachedEmployeId) {
      this. fetchCongesForEmploye(this.cachedEmployeId);
      return;
    }

    const storedEmployeId = localStorage. getItem('employe_id');
    if (storedEmployeId) {
      this.cachedEmployeId = parseInt(storedEmployeId, 10);
      this.fetchCongesForEmploye(this.cachedEmployeId);
      return;
    }

    this.http.get<any>(`${this.employeApiUrl}/my-profile`).pipe(
      map((response: any) => response.data || response),
      catchError(() => of(null))
    ).subscribe({
      next: (employe:  any) => {
        if (employe?. id) {
          this.cachedEmployeId = employe.id;
          localStorage.setItem('employe_id', employe.id.toString());
          this.fetchCongesForEmploye(employe.id);
        } else {
          this.congeAlertsSubject.next([]);
        }
      }
    });
  }

  private fetchCongesForEmploye(employeId: number): void {
    this.http.get<any>(`${this.congeApiUrl}/employe/${employeId}`, {
      params:  { statut: 'APPROUVEE', size: '50' }
    }).pipe(
      catchError(() => of({ content: [] }))
    ).subscribe({
      next: (response: any) => {
        const demandes = response?. content || response?.data?.content || response?.data || [];
        const alerts = this.generateCongeAlerts(demandes);
        this.congeAlertsSubject. next(alerts);
      }
    });
  }

  private generateCongeAlerts(demandes:  any[]): CongeAlertDto[] {
    const alerts: CongeAlertDto[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ Récupérer les alertes fermées
    const dismissedAlerts = this.getDismissedAlertIds();

    demandes.forEach((demande: any) => {
      if (! demande.dateDebut || !demande.dateFin) return;

      const dateDebut = new Date(demande.dateDebut);
      const dateFin = new Date(demande.dateFin);
      dateDebut.setHours(0, 0, 0, 0);
      dateFin.setHours(0, 0, 0, 0);

      const diffDebut = Math.ceil((dateDebut. getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffFin = Math. ceil((dateFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let alert: CongeAlertDto | null = null;

      if (diffDebut === 1) {
        alert = this.createAlert('CONGE_COMMENCE_DEMAIN', demande, 
          '🔔 Votre congé commence demain ! ',
          'Préparez-vous, votre congé débute demain.',
          'bi-bell-fill', 'alert-warning');
      } else if (diffDebut === 0 && diffFin > 0) {
        alert = this. createAlert('CONGE_COMMENCE_AUJOURD_HUI', demande,
          '🚀 Votre congé commence aujourd\'hui !',
          'C\'est le début de votre congé.  Bon repos !',
          'bi-rocket-takeoff-fill', 'alert-info');
      } else if (diffDebut < 0 && diffFin > 0) {
        const dureeTotal = Math. ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const jourActuel = Math.abs(diffDebut) + 1;
        alert = {
          id: `CONGE_EN_COURS-${demande.id}`,
          type: 'CONGE_EN_COURS',
          titre: '🏖️ Vous êtes en congé',
          message: `Jour ${jourActuel} sur ${dureeTotal}.  Il vous reste ${diffFin} jour(s).`,
          dateDebut:  demande.dateDebut,
          dateFin: demande. dateFin,
          typeConge:  demande.typeConge,
          demandeId: demande.id,
          jourActuel,
          dureeTotal,
          joursRestants: diffFin,
          icon: 'bi-umbrella-fill',
          colorClass: 'alert-success'
        };
      } else if (diffFin === 0 && diffDebut <= 0) {
        alert = this. createAlert('CONGE_SE_TERMINE_AUJOURD_HUI', demande,
          '🎉 Dernier jour de congé !',
          'Votre congé se termine aujourd\'hui.  Bon retour demain ! ',
          'bi-calendar-check-fill', 'alert-primary');
      } else if (diffFin === -1) {
        alert = this.createAlert('CONGE_RETOUR', demande,
          '👋 Bon retour parmi nous !',
          'Votre congé s\'est terminé hier. Bienvenue ! ',
          'bi-emoji-smile-fill', 'alert-success');
      }

      // ✅ Vérifier si l'alerte n'a pas été fermée
      if (alert && ! dismissedAlerts. includes(alert.id)) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  private createAlert(
    type: CongeAlertDto['type'], 
    demande: any, 
    titre: string, 
    message: string, 
    icon:  string, 
    colorClass: string
  ): CongeAlertDto {
    return {
      id: `${type}-${demande.id}`,
      type,
      titre,
      message,
      dateDebut: demande.dateDebut,
      dateFin: demande.dateFin,
      typeConge: demande.typeConge,
      demandeId: demande.id,
      icon,
      colorClass
    };
  }

  /**
   * ✅ Fermer une alerte de congé
   */
  dismissCongeAlert(alertId: string): void {
    // Récupérer les alertes actuellement fermées
    const dismissed = this.getDismissedAlertsData();
    
    // Ajouter la nouvelle alerte fermée avec la date
    dismissed[alertId] = new Date().toISOString();
    
    // Sauvegarder dans localStorage
    this.saveDismissedAlerts(dismissed);
    
    // Mettre à jour l'affichage
    const currentAlerts = this. congeAlertsSubject.value;
    this.congeAlertsSubject.next(currentAlerts.filter(a => a.id !== alertId));
  }

  /**
   * ✅ Alias pour dismissCongeAlert (pour compatibilité avec le composant)
   */
  dismissAlert(alertId: string): void {
    this.dismissCongeAlert(alertId);
  }

  /**
   * ✅ Sauvegarder les alertes fermées
   */
  private saveDismissedAlerts(data: Record<string, string>): void {
    try {
      localStorage. setItem(DISMISSED_ALERTS_KEY, JSON.stringify(data));
    } catch (e) {
      // Silencieux en cas d'erreur
    }
  }

  /**
   * ✅ Récupérer les IDs des alertes fermées
   */
  private getDismissedAlertIds(): string[] {
    const data = this.getDismissedAlertsData();
    return Object.keys(data);
  }

  /**
   * ✅ Récupérer les données complètes des alertes fermées
   */
  private getDismissedAlertsData(): Record<string, string> {
    try {
      const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (! stored) return {};
      
      const parsed = JSON.parse(stored);
      
      // Si c'est un tableau (ancien format), convertir en objet
      if (Array.isArray(parsed)) {
        const converted: Record<string, string> = {};
        parsed.forEach((id: string) => {
          converted[id] = new Date().toISOString();
        });
        this.saveDismissedAlerts(converted);
        return converted;
      }
      
      return parsed;
    } catch {
      return {};
    }
  }

  /**
   * ✅ Nettoyer les anciennes alertes fermées (plus de 30 jours)
   */
  private cleanupOldDismissedAlerts(): void {
    const dismissed = this.getDismissedAlertsData();
    const now = new Date().getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    
    const cleaned: Record<string, string> = {};
    
    Object.entries(dismissed).forEach(([alertId, dateStr]) => {
      const dismissedDate = new Date(dateStr).getTime();
      const age = now - dismissedDate;
      
      if (age < maxAge) {
        cleaned[alertId] = dateStr;
      }
    });
    
    this.saveDismissedAlerts(cleaned);
  }

  loadAllNotifications(page: number = 0, size: number = 20): Observable<PageResponse<NotificationDto>> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map((response: any) => {
        const data = response. data || response;
        return {
          content:  data.content ??  [],
          totalElements:  data.totalElements ??  0,
          totalPages: data. totalPages ?? 0,
          size:  data.size ?? size,
          number:  data.number ?? page
        };
      })
    );
  }

  marquerCommeLu(id: number): Observable<any> {
    const currentNotifs = this.notificationsSubject.value;
    const updatedNotifs = currentNotifs.map(n => n.id === id ?  { ...n, lu: true } : n);
    this.notificationsSubject.next(updatedNotifs);
    this.countSubject.next(Math.max(0, this.countSubject.value - 1));

    return this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {}).pipe(
      catchError(() => {
        this.notificationsSubject. next(currentNotifs);
        this.countSubject. next(this.countSubject. value + 1);
        return of(null);
      })
    );
  }

  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this. notificationsSubject.value;
    this.notificationsSubject.next(currentNotifs.map(n => ({ ...n, lu: true })));
    this.countSubject. next(0);

    return this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {}).pipe(
      catchError(() => {
        this.notificationsSubject.next(currentNotifs);
        return of(null);
      })
    );
  }

  toggleDropdown(): void {
    this. showDropdownSubject.next(! this.showDropdownSubject.value);
  }

  closeDropdown(): void {
    this.showDropdownSubject. next(false);
  }

  /**
   * ✅ Clear - NE supprime PAS les alertes fermées du localStorage
   */
  clear(): void {
    this.isInitialized = false;
    this. cachedEmployeId = null;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.countSubject.next(0);
    this.notificationsSubject.next([]);
    this.congeAlertsSubject.next([]);
    // ✅ On NE supprime PAS DISMISSED_ALERTS_KEY du localStorage ! 
  }

  private canReceiveNotifications(): boolean {
    const role = localStorage.getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this.clear();
  }
}