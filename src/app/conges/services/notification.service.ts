import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { retry, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private employeApiUrl = `${environment.apiUrl}/api/employes`;

  private countSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private congeAlertsSubject = new BehaviorSubject<CongeAlertDto[]>([]);
  private showDropdownSubject = new BehaviorSubject<boolean>(false);
  
  private pollingSubscription:  Subscription | null = null;
  private isInitialized = false;
  
  // ✅ Cache de l'ID employé pour éviter les appels répétés
  private cachedEmployeId:  number | null = null;

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
    
    this. pollingSubscription = timer(0, 30000).subscribe(() => {
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
          const count = typeof response === 'number' ? response : (response.data ??  0);
          this.countSubject.next(count);
        },
        error: (err:  any) => console.error('Erreur count:', err)
      });
  }

  private loadRecentNotifications(): void {
    this.http.get<any>(`${this.apiUrl}? page=0&size=10`)
      .pipe(retry(1))
      .subscribe({
        next: (response: any) => {
          const list = response.data?. content ??  response.data ??  response. content ??  [];
          this. notificationsSubject.next(list);
        },
        error: (err:  any) => console.error('Erreur notifications:', err)
      });
  }

  /**
   * ✅ Charge les demandes de congés approuvées pour générer les alertes
   * Utilise le même endpoint que le reste de l'app:  /api/employes/my-profile
   */
  private loadCongeAlerts(): void {
    const role = localStorage.getItem('user_role') || '';
    
    // Seulement pour les employés
    if (role !== 'EMPLOYE') {
      this.congeAlertsSubject. next([]);
      return;
    }

    // Si on a déjà l'ID en cache, l'utiliser directement
    if (this.cachedEmployeId) {
      this. fetchCongesForEmploye(this.cachedEmployeId);
      return;
    }

    // Vérifier dans localStorage
    const storedEmployeId = localStorage.getItem('employe_id');
    if (storedEmployeId) {
      this.cachedEmployeId = parseInt(storedEmployeId, 10);
      this.fetchCongesForEmploye(this.cachedEmployeId);
      return;
    }

    // ✅ Utiliser le bon endpoint:  /api/employes/my-profile
    this.http.get<any>(`${this.employeApiUrl}/my-profile`).pipe(
      map((response: any) => response.data || response),
      catchError((err) => {
        console.error('Erreur récupération profil employé:', err);
        return of(null);
      })
    ).subscribe({
      next: (employe:  any) => {
        if (employe && employe.id) {
          // Sauvegarder pour la prochaine fois
          this.cachedEmployeId = employe.id;
          localStorage.setItem('employe_id', employe. id.toString());
          console.log('✅ Profil employé récupéré pour alertes, ID:', employe. id);
          this.fetchCongesForEmploye(employe.id);
        } else {
          console.warn('Profil employé non disponible pour les alertes');
          this.congeAlertsSubject. next([]);
        }
      }
    });
  }

  /**
   * ✅ Récupère les congés pour un employé donné
   */
  private fetchCongesForEmploye(employeId: number): void {
    this.http.get<any>(`${this.congeApiUrl}/employe/${employeId}`, {
      params:  { 
        statut: 'APPROUVEE', 
        size: '50' 
      }
    }).pipe(
      catchError((err) => {
        console. error('Erreur chargement congés:', err);
        return of({ content: [] });
      })
    ).subscribe({
      next: (response: any) => {
        const demandes = response?. content || response?.data?.content || response?.data || [];
        console.log('📋 Demandes pour alertes:', demandes. length);
        
        const alerts = this.generateCongeAlerts(demandes);
        this.congeAlertsSubject. next(alerts);
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
          dateFin: demande.dateFin,
          typeConge: demande.typeConge,
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
        const dureeTotal = Math.ceil((dateFin. getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const jourActuel = Math.abs(diffDebut) + 1;
        alert = {
          id: `CONGE_EN_COURS-${demande. id}`,
          type: 'CONGE_EN_COURS',
          titre: '🏖️ Vous êtes en congé',
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
      }
      // 🎉 Congé qui SE TERMINE AUJOURD'HUI
      else if (diffFin === 0 && diffDebut <= 0) {
        alert = {
          id: `CONGE_SE_TERMINE_AUJOURD_HUI-${demande.id}`,
          type: 'CONGE_SE_TERMINE_AUJOURD_HUI',
          titre: '🎉 Dernier jour de congé !',
          message: 'Votre congé se termine aujourd\'hui.  Bon retour demain !',
          dateDebut: demande.dateDebut,
          dateFin: demande. dateFin,
          typeConge:  demande.typeConge,
          demandeId: demande.id,
          icon: 'bi-calendar-check-fill',
          colorClass: 'alert-primary'
        };
      }
      // 👋 Congé TERMINÉ HIER
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

      if (alert && ! dismissedAlerts.includes(alert.id)) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  dismissCongeAlert(alertId: string): void {
    const dismissed = this.getDismissedAlerts();
    if (! dismissed.includes(alertId)) {
      dismissed.push(alertId);
      localStorage.setItem('dismissedCongeAlerts', JSON. stringify(dismissed));
    }
    
    const currentAlerts = this.congeAlertsSubject.value;
    this.congeAlertsSubject.next(currentAlerts. filter(a => a.id !== alertId));
  }

  private getDismissedAlerts(): string[] {
    const stored = localStorage.getItem('dismissedCongeAlerts');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  resetDismissedAlerts(): void {
    localStorage.removeItem('dismissedCongeAlerts');
    this.cachedEmployeId = null;
    this.loadCongeAlerts();
  }

  loadAllNotifications(page: number = 0, size: number = 20): Observable<PageResponse<NotificationDto>> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map((response: any) => {
        if (response. data) {
          return {
            content: response.data.content ??  response.data ??  [],
            totalElements:  response.data.totalElements ?? 0,
            totalPages:  response.data.totalPages ?? 0,
            size: response.data. size ?? size,
            number:  response.data.number ?? page
          };
        }
        return {
          content: response.content ?? [],
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 0,
          size: response.size ?? size,
          number: response.number ?? page
        };
      })
    );
  }


  marquerToutesCommeLues(): Observable<any> {
    const currentNotifs = this.notificationsSubject. value;
    this.notificationsSubject.next(currentNotifs.map(n => ({ ...n, lu: true })));
    this.countSubject.next(0);
    return this.http.put(`${this.apiUrl}/marquer-toutes-lues`, {});
  }

  toggleDropdown(): void {
    this.showDropdownSubject.next(! this.showDropdownSubject.value);
  }

  closeDropdown(): void {
    this.showDropdownSubject. next(false);
  }

  clear(): void {
    console.log('NotificationService: Nettoyage');
    this.isInitialized = false;
    this. cachedEmployeId = null;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.countSubject.next(0);
    this.notificationsSubject.next([]);
    this.congeAlertsSubject.next([]);
  }

  private canReceiveNotifications(): boolean {
    const role = localStorage. getItem('user_role') || '';
    return role === 'EMPLOYE' || role === 'EMPLOYEUR';
  }

  ngOnDestroy(): void {
    this. clear();
  }


  marquerCommeLu(id: number): Observable<any> {
  console.log('📌 Marquage notification comme lue, ID:', id);
  
  // Optimistic UI update
  const currentNotifs = this.notificationsSubject.value;
  const updatedNotifs = currentNotifs.map(n => 
    n.id === id ? { ... n, lu: true } : n
  );
  this.notificationsSubject.next(updatedNotifs);
  
  // Décrémenter le compteur
  const newCount = Math.max(0, this.countSubject.value - 1);
  this.countSubject. next(newCount);
  console.log('📊 Nouveau compteur:', newCount);

  return this.http.put(`${this.apiUrl}/${id}/marquer-lu`, {}).pipe(
    tap(() => console.log('✅ Notification marquée comme lue côté serveur')),
    catchError((err) => {
      console.error('❌ Erreur marquage notification:', err);
      // Rollback en cas d'erreur
      this.notificationsSubject. next(currentNotifs);
      this.countSubject. next(this.countSubject. value + 1);
      return of(null);
    })
  );
}

}