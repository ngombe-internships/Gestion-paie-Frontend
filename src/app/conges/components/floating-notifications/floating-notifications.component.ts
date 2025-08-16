import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationDto, NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../services/auth.service';

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
  isVisible = false; // Pour afficher/masquer selon le rôle

  private subscriptions = new Subscription();

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur peut voir les notifications
this.subscriptions.add(
    this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('FloatingNotifications: Changement authentification:', isAuth);
      this.checkVisibility();

      if (!isAuth) {
        // Si déconnecté, nettoyer tout
        this.count = 0;
        this.notifications = [];
        this.showDropdown = false;
        this.isVisible = false;
      } else if (this.isVisible) {
        // ✅ NOUVEAU : Si connecté et visible, s'abonner aux notifications
        this.subscribeToNotifications();
      }
    })
  );

    this.checkVisibility();

    if (this.isVisible) {
      // S'abonner aux observables
      this.subscriptions.add(
        this.notificationService.count$.subscribe(count => {
          this.count = count;
        })
      );

      this.subscriptions.add(
        this.notificationService.notifications$.subscribe(notifications => {
          this.notifications = notifications;
        })
      );

      this.subscriptions.add(
        this.notificationService.showDropdown$.subscribe(show => {
          this.showDropdown = show;
        })
      );

      // Initialiser les notifications
      this.notificationService.initForUser();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private checkVisibility() {
    const role = this.authService.getUserRole();
    const isAuthenticated = this.authService.isLoggedIn();
    this.isVisible = isAuthenticated && (role === 'EMPLOYE' || role === 'EMPLOYEUR');

  }

  private subscribeToNotifications() {
  // S'abonner aux observables
  this.subscriptions.add(
    this.notificationService.count$.subscribe(count => {
      console.log('FloatingNotifications: Count reçu:', count);
      this.count = count;
    })
  );

  this.subscriptions.add(
    this.notificationService.notifications$.subscribe(notifications => {
      console.log('FloatingNotifications: Notifications reçues:', notifications.length);
      this.notifications = notifications;
    })
  );

  this.subscriptions.add(
    this.notificationService.showDropdown$.subscribe(show => {
      this.showDropdown = show;
    })
  );

  // Initialiser les notifications
  console.log('FloatingNotifications: Initialisation du service...');
  this.notificationService.initForUser();
}

  toggleDropdown() {
    this.notificationService.toggleDropdown();
  }

  onNotificationClick(notification: NotificationDto) {
    if (!notification.lu) {
      this.notificationService.marquerCommeLu(notification.id).subscribe();
    }

    // Navigation vers le lien d'action si disponible
    if (notification.lienAction) {
      this.router.navigate([notification.lienAction]);
    } else if (notification.referenceType === 'DEMANDE_CONGE' && notification.referenceId) {
      this.router.navigate(['/dashboard/conges/demandes', notification.referenceId]);
    }

    this.notificationService.closeDropdown();
  }

  marquerToutesLues() {
    if (this.count > 0) {
      this.loading = true;
      this.notificationService.marquerToutesCommeLues().subscribe({
        next: () => {
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.floating-notification-container')) {
      this.notificationService.closeDropdown();
    }
  }

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

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    return date.toLocaleDateString('fr-FR');
  }

  trackByNotificationId(index: number, notification: NotificationDto): number {
    return notification.id;
  }

  closeDropdown() {
  this.notificationService.closeDropdown();
 }
}
