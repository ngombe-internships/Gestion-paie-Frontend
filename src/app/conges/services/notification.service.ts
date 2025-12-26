import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { retry, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface CongeAlertDto {
  id: string;
  type: 'CONGE_COMMENCE_DEMAIN' | 'CONGE_COMMENCE_AUJOURD_HUI' | 'CONGE_EN_COURS' | 'CONGE_SE_TERMINE_AUJOURD_HUI' | 'CONGE_RETOUR';
  titre: string;
  message: string;
  dateDebut: string;
  dateFin:  string;
  typeConge: string;
  demandeId:  number;
  dureeTotal?:  number;
  jourActuel?: number;
  joursRestants?: number;
  icon:  string;
  colorClass:  string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number:  number;
}

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
    if (this.isInitialized || ! this.canReceiveNotifications()) {
      return;
    }

    this. isInitialized = true;
    
    // ✅ Nettoyer les anciennes alertes fermées au démarrage
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
          this.countSubject. next(count);
        },
        error: () => {}
      });
  }

  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}?page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response: any) => {
          const list = response.data?. content ?? response.data ??  response. content ??  [];
          this. notificationsSubject.next(list);
        },
        error: () => {}
      });
  }

  private loadCongeAlerts(): void {
    const role = localStorage.getItem('user_role') || '';
    
    if (role !== 'EMPLOYE') {
      this. congeAlertsSubject.next([]);
      return;
    }

    if (this.cachedEmployeId) {
      this.fetchCongesForEmploye(this.cachedEmployeId);
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
      next: (employe: any) => {
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
    const alerts:  CongeAlertDto[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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

      if (diffDebut === 1) {
        alert = {
          id: `CONGE_COMMENCE_DEMAIN-${demande.id}`,
          type: 'CONGE_COMMENCE_DEMAIN',
          titre: '🔔 Votre congé commence demain ! ',
          message:  'Préparez-vous, votre congé débute demain.',
          dateDebut:  demande.dateDebut,
          dateFin: demande.dateFin,
          typeConge: demande.typeConge,
          demandeId: demande.id,
          icon: 'bi-bell-fill',
          colorClass: 'alert-warning'
        };
      } else if (diffDebut === 0 && diffFin > 0) {
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
      } else if (diffDebut < 0 && diffFin > 0) {
        const dureeTotal = Math. ceil((dateFin. getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const jourActuel = Math.abs(diffDebut) + 1;
        alert = {
          id: `CONGE_EN_COURS-${demande.id}`,
          type: 'CONGE_EN_COURS',
          titre:  '🏖️ Vous êtes en congé',
          message: `Jour ${jourActuel} sur ${dureeTotal}.  Il vous reste ${diffFin} jour(s).`,
          dateDebut: demande. dateDebut,
          dateFin:  demande.dateFin,
          typeConge: demande.typeConge,
          demandeId: demande. id,
          jourActuel,
          dureeTotal,
          joursRestants: diffFin,
          icon: 'bi-umbrella-fill',
          colorClass: 'alert-success'
        };
      } else if (diffFin === 0 && diffDebut <= 0) {
        alert = {
          id: `CONGE_SE_TERMINE_AUJOURD_HUI-${demande. id}`,
          type: 'CONGE_SE_TERMINE_AUJOURD_HUI',
          titre: '🎉 Dernier jour de congé ! ',
          message:  'Votre congé se termine aujourd\'hui.  Bon retour demain !',
          dateDebut: demande.dateDebut,
          dateFin: demande. dateFin,
          typeConge:  demande.typeConge,
          demandeId: demande.id,
          icon: 'bi-calendar-check-fill',
          colorClass: 'alert-primary'
        };
      } else if (diffFin === -1) {
        alert = {
          id: `CONGE_RETOUR-${demande. id}`,
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

      if (alert && ! dismissedAlerts. includes(alert.id)) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * ✅ Fermer une alerte de congé
   */
  dismissCongeAlert(alertId: string): void {
    const dismissed = this.getDismissedAlerts();
    if (! dismissed.includes(alertId)) {
      // ✅ Sauvegarder avec la date pour nettoyage futur
      const dismissedWithDate = this.getDismissedAlertsWithDate();
      dismissedWithDate[alertId] = new Date().toISOString();
      localStorage.setItem('dismissedCongeAlerts', JSON. stringify(dismissedWithDate));
    }
    
    const currentAlerts = this. congeAlertsSubject.value;
    this.congeAlertsSubject.next(currentAlerts. filter(a => a.id !== alertId));
  }

  /**
   * ✅ Récupérer les alertes fermées (liste simple)
   */
  private getDismissedAlerts(): string[] {
    const stored = localStorage.getItem('dismissedCongeAlerts');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      // Support ancien format (array) et nouveau format (object)
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return Object.keys(parsed);
    } catch {
      return [];
    }
  }

  /**
   * ✅ Récupérer les alertes fermées avec date
   */
  private getDismissedAlertsWithDate(): Record<string, string> {
    const stored = localStorage.getItem('dismissedCongeAlerts');
    if (!stored) return {};
    try {
      const parsed = JSON.parse(stored);
      // Convertir ancien format si nécessaire
      if (Array.isArray(parsed)) {
        const converted: Record<string, string> = {};
        parsed.forEach(id => {
          converted[id] = new Date().toISOString();
        });
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
    const dismissed = this.getDismissedAlertsWithDate();
    const now = new Date();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
    
    const cleaned: Record<string, string> = {};
    
    Object.entries(dismissed).forEach(([alertId, dateStr]) => {
      const dismissedDate = new Date(dateStr);
      const age = now.getTime() - dismissedDate.getTime();
      
      // Garder seulement les alertes fermées depuis moins de 30 jours
      if (age < maxAge) {
        cleaned[alertId] = dateStr;
      }
    });
    
    localStorage.setItem('dismissedCongeAlerts', JSON.stringify(cleaned));
  }

  loadAllNotifications(page: number = 0, size: number = 20): Observable<PageResponse<NotificationDto>> {
    return this.http.get<any>(`${this.apiUrl}? page=${page}&size=${size}`).pipe(
      map((response: any) => {
        const data = response. data || response;
        return {
          content:  data.content ?? [],
          totalElements:  data.totalElements ??  0,
          totalPages: data. totalPages ?? 0,
          size:  data.size ?? size,
          number:  data.number ?? page
        };
      })
    );
  }

  marquerCommeLu(id:  number): Observable<any> {
    const currentNotifs = this.notificationsSubject. value;
    const updatedNotifs = currentNotifs.map(n => n. id === id ?  { ...n, lu: true } : n);
    this.notificationsSubject. next(updatedNotifs);
    this.countSubject. next(Math.max(0, this. countSubject.value - 1));

    return this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {}).pipe(
      catchError(() => {
        this.notificationsSubject.next(currentNotifs);
        this.countSubject. next(this.countSubject. value + 1);
        return of(null);
      })
    );
  }

  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this. notificationsSubject.value;
    this.notificationsSubject.next(currentNotifs.map(n => ({ ... n, lu: true })));
    this.countSubject. next(0);

    return this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {}).pipe(
      catchError(() => {
        this.notificationsSubject.next(currentNotifs);
        return of(null);
      })
    );
  }

  toggleDropdown(): void {
    this.showDropdownSubject.next(! this.showDropdownSubject.value);
  }

  closeDropdown(): void {
    this. showDropdownSubject.next(false);
  }

  /**
   * ✅ Clear - Ne supprime PAS les alertes fermées
   */
  clear(): void {
    this.isInitialized = false;
    this. cachedEmployeId = null;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.countSubject. next(0);
    this.notificationsSubject.next([]);
    this.congeAlertsSubject.next([]);
    // ✅ On ne supprime PAS dismissedCongeAlerts du localStorage
  }

  private canReceiveNotifications(): boolean {
    const role = localStorage. getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this. clear();
  }
}