import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationDto, NotificationService } from '../../services/notification.service';

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
    this. subscriptions.add(
      this.authService.isAuthenticated$.subscribe(isAuth => {
        console.log('FloatingNotifications: Authentification:', isAuth);

        if (! isAuth) {
          // Déconnecté:  nettoyer tout
          this.notificationService.clear();
          this.count = 0;
          this.notifications = [];
          this. showDropdown = false;
          this. isVisible = false;
          this.isSubscribedToNotifications = false;
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
    this. subscriptions.unsubscribe();
    // Ne pas appeler clear() ici car le service est partagé globalement
  }

  /**
   * Vérifie si le composant doit être visible selon le rôle
   */
  private checkVisibility(): void {
    const role = this.authService.getUserRole();
    const isAuthenticated = this.authService.isLoggedIn();
    this.isVisible = isAuthenticated && (role === 'EMPLOYE' || role === 'EMPLOYEUR');
    console.log('FloatingNotifications: isVisible =', this. isVisible, ', role =', role);
  }

  /**
   * S'abonne aux observables du service de notifications
   */
  private subscribeToNotifications(): void {
    // Protection contre les doubles abonnements
    if (this.isSubscribedToNotifications) {
      console.log('FloatingNotifications: Déjà abonné, skip');
      return;
    }

    this.isSubscribedToNotifications = true;
    console.log('FloatingNotifications:  Abonnement aux notifications');

    // Abonnement au compteur
    this. subscriptions.add(
      this.notificationService.count$.subscribe(count => {
        console.log('FloatingNotifications: Count reçu:', count);
        this.count = count;
      })
    );

    // Abonnement à la liste des notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        console.log('FloatingNotifications:  Notifications reçues:', notifications.length);
        this.notifications = notifications;
      })
    );

    // Abonnement à l'état du dropdown
    this. subscriptions.add(
      this.notificationService.showDropdown$.subscribe(show => {
        this.showDropdown = show;
      })
    );

    // Initialiser le service (le polling démarre ici)
    console.log('FloatingNotifications: Initialisation du service.. .');
    this.notificationService.initForUser();
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
    if (! notification.lu) {
      this.notificationService. marquerCommeLu(notification.id).subscribe();
    }

    // Redirection selon le type et le rôle
    if (notification.type. includes('DEMANDE_CONGE') ||
        notification.type.includes('CONGE_') ||
        notification. referenceType === 'DEMANDE_CONGE') {
      
      const role = this.authService.getUserRole();
      if (role === 'EMPLOYE') {
        console.log('Redirection vers mes demandes de congés (employé)');
        this.router.navigate(['/dashboard/conges/mes-demandes']);
      } else {
        console.log('Redirection vers la liste des demandes (employeur)');
        this.router. navigate(['/dashboard/conges/demandes']);
      }
      this.notificationService.closeDropdown();
      return;
    }

    if (notification.lienAction) {
      console.log('Navigation via lienAction:', notification.lienAction);
      this.router.navigate([notification.lienAction]);
    } else if (notification.type. includes('BULLETIN_PAIE') ||
               notification. referenceType === 'BULLETIN_PAIE') {
      console.log('Navigation vers les bulletins de paie');
      this.router.navigate(['/dashboard/bulletins']);
    } else {
      console.log('Navigation fallback vers dashboard');
      this.router.navigate(['/dashboard']);
    }

    this.notificationService.closeDropdown();
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
      this.notificationService. closeDropdown();
    }
  }

  /**
   * Retourne l'icône appropriée selon le type de notification
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DEMANDE_CONGE_SOUMISE':
        return 'bi-calendar-plus text-warning';
      case 'DEMANDE_CONGE_APPROUVEE':
        return 'bi-calendar-check text-success';
      case 'DEMANDE_CONGE_REJETEE':
        return 'bi-calendar-x text-danger';
      case 'BULLETIN_PAIE_DISPONIBLE':
        return 'bi-file-earmark-text text-info';
      default:
        return 'bi-bell text-primary';
    }
  }

  /**
   * Formate le temps écoulé depuis la création
   */
getTimeAgo(dateString: string): string {
  if (!dateString) return '';
  
  // Parser la date en UTC
  let date:  Date;
  
  // Si la date ne contient pas de timezone, on suppose qu'elle est en UTC
  if (! dateString.includes('Z') && !dateString. includes('+')) {
    date = new Date(dateString + 'Z'); // Ajouter Z pour indiquer UTC
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
   * TrackBy pour optimiser le rendu de la liste
   */
  trackByNotificationId(index: number, notification: NotificationDto): number {
    return notification.id;
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown(): void {
    this.notificationService.closeDropdown();
  }
}