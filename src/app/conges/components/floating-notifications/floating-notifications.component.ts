import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationDto, CongeAlertDto, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-floating-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './floating-notifications.component.html',
  styleUrls: ['./floating-notifications.component.css']
})
export class FloatingNotificationsComponent implements OnInit, OnDestroy {
  count = 0;
  notifications: NotificationDto[] = [];
  congeAlerts: CongeAlertDto[] = [];
  showDropdown = false;
  loading = false;
  isVisible = false;

  private subscriptions = new Subscription();
  private isSubscribedToNotifications = false;

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'authentification
    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe(isAuth => {
        console.log('FloatingNotifications: Authentification:', isAuth);

        if (!isAuth) {
          this.resetState();
        } else {
          this.checkVisibility();
          if (this.isVisible && !this.isSubscribedToNotifications) {
            this.subscribeToNotifications();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Réinitialise l'état du composant
   */
  private resetState(): void {
    this.notificationService.clear();
    this.count = 0;
    this.notifications = [];
    this.congeAlerts = [];
    this.showDropdown = false;
    this.isVisible = false;
    this.isSubscribedToNotifications = false;
  }

  /**
   * Vérifie si le composant doit être visible selon le rôle
   */
  private checkVisibility(): void {
    const role = this.authService.getUserRole();
    const isAuthenticated = this.authService.isLoggedIn();
    this.isVisible = isAuthenticated && (role === 'EMPLOYE' || role === 'EMPLOYEUR');
    console.log('FloatingNotifications: isVisible =', this.isVisible, ', role =', role);
  }

  /**
   * S'abonne aux observables du service de notifications
   */
  private subscribeToNotifications(): void {
    if (this.isSubscribedToNotifications) {
      console.log('FloatingNotifications: Déjà abonné, skip');
      return;
    }

    this.isSubscribedToNotifications = true;
    console.log('FloatingNotifications: Abonnement aux notifications');

    // Abonnement au compteur
    this.subscriptions.add(
      this.notificationService.count$.subscribe(count => {
        console.log('FloatingNotifications: Count reçu:', count);
        this.count = count;
      })
    );

    // Abonnement à la liste des notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        console.log('FloatingNotifications: Notifications reçues:', notifications.length);
        this.notifications = notifications;
      })
    );

    // Abonnement aux alertes de congés
    this.subscriptions.add(
      this.notificationService.congeAlerts$.subscribe(alerts => {
        console.log('FloatingNotifications: Alertes congés reçues:', alerts.length);
        this.congeAlerts = alerts;
      })
    );

    // Abonnement à l'état du dropdown
    this.subscriptions.add(
      this.notificationService.showDropdown$.subscribe(show => {
        this.showDropdown = show;
      })
    );

    // Initialiser le service (le polling démarre ici)
    console.log('FloatingNotifications: Initialisation du service...');
    this.notificationService.initForUser();
  }

  /**
   * Compteur total (notifications + alertes)
   */
  get totalCount(): number {
    return this.count + this.congeAlerts.length;
  }

  /**
   * Toggle du dropdown
   */
  toggleDropdown(): void {
    this.notificationService.toggleDropdown();
  }

  /**
   * Gestion du clic sur une notification
   */
  onNotificationClick(notification: NotificationDto): void {
    // Marquer comme lue si nécessaire
    if (!notification.lu) {
      this.notificationService.marquerCommeLu(notification.id).subscribe();
    }

    // Redirection selon le type et le rôle
    if (notification.type.includes('DEMANDE_CONGE') ||
        notification.type.includes('CONGE_') ||
        notification.referenceType === 'DEMANDE_CONGE') {
      
      const role = this.authService.getUserRole();
      const route = role === 'EMPLOYE' 
        ? '/dashboard/conges/mes-demandes'
        : '/dashboard/conges/demandes';
      
      this.router.navigate([route]);
      this.notificationService.closeDropdown();
      return;
    }

    if (notification.lienAction) {
      this.router.navigate([notification.lienAction]);
    } else if (notification.type.includes('BULLETIN_PAIE') ||
               notification.referenceType === 'BULLETIN_PAIE') {
      this.router.navigate(['/dashboard/bulletins']);
    } else {
      this.router.navigate(['/dashboard']);
    }

    this.notificationService.closeDropdown();
  }

  /**
   * Gestion du clic sur une alerte de congé
   */
  onCongeAlertClick(alert: CongeAlertDto): void {
    this.router.navigate(['/dashboard/conges/mes-demandes']);
    this.notificationService.closeDropdown();
  }

  /**
   * Fermer une alerte de congé
   */
  dismissCongeAlert(event: Event, alert: CongeAlertDto): void {
    event.stopPropagation();
    this.notificationService.dismissCongeAlert(alert.id);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  marquerToutesLues(): void {
    if (this.count > 0) {
      this.loading = true;
      this.notificationService.marquerToutesCommeLues().subscribe({
        next: () => this.loading = false,
        error: () => this.loading = false
      });
    }
  }

  /**
   * Ferme le dropdown si on clique en dehors
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.floating-notification-container')) {
      this.notificationService.closeDropdown();
    }
  }

  /**
   * Retourne l'icône appropriée selon le type de notification
   */
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'DEMANDE_CONGE_SOUMISE': 'bi-calendar-plus text-warning',
      'DEMANDE_CONGE_APPROUVEE': 'bi-calendar-check text-success',
      'DEMANDE_CONGE_REJETEE': 'bi-calendar-x text-danger',
      'BULLETIN_PAIE_DISPONIBLE': 'bi-file-earmark-text text-info'
    };
    return icons[type] || 'bi-bell text-primary';
  }

  /**
   * Formate le temps écoulé depuis la création
   */
  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    
    let date: Date;
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Formate une date courte
   */
  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  /**
   * Label du type de congé
   */
  getTypeCongeLabel(type: string): string {
    const labels: Record<string, string> = {
      'CONGE_PAYE': 'Congé payé',
      'CONGE_MALADIE': 'Congé maladie',
      'CONGE_MATERNITE': 'Congé maternité',
      'CONGE_PATERNITE': 'Congé paternité',
      'CONGE_SANS_SOLDE': 'Sans solde',
      'CONGE_EXCEPTIONNEL': 'Exceptionnel'
    };
    return labels[type] || type;
  }

  /**
   * TrackBy pour optimiser le rendu de la liste des notifications
   */
  trackByNotificationId(_index: number, notification: NotificationDto): number {
    return notification.id;
  }

  /**
   * TrackBy pour optimiser le rendu de la liste des alertes
   */
  trackByAlertId(_index: number, alert: CongeAlertDto): string {
    return alert.id;
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown(): void {
    this.notificationService.closeDropdown();
  }
}