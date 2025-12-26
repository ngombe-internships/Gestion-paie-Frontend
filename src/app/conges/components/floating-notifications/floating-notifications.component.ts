import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
    private router: Router,
    private sanitizer: DomSanitizer
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
   * Retourne l'icône SVG selon le type de notification
   */
  getNotificationIconSvg(type: string): SafeHtml {
    let svg = '';
    let color = '#007bff';

    switch (type) {
      case 'DEMANDE_CONGE_SOUMISE':
        color = '#ffc107';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>`;
        break;
      case 'DEMANDE_CONGE_APPROUVEE':
      case 'CONGE_APPROUVE':
        color = '#28a745';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>`;
        break;
      case 'DEMANDE_CONGE_REJETEE':
      case 'CONGE_REJETE':
        color = '#dc3545';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>`;
        break;
      case 'BULLETIN_PAIE_DISPONIBLE':
        color = '#17a2b8';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
          <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
        </svg>`;
        break;
      default:
        color = '#007bff';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /**
   * Retourne l'icône SVG pour les alertes de congés
   */
  getCongeAlertIconSvg(type: string): SafeHtml {
    let svg = '';
    let color = '#007bff';

    switch (type) {
      case 'CONGE_IMMINENT':
        color = '#ffc107';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="${color}" viewBox="0 0 16 16">
          <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
        </svg>`;
        break;
      case 'CONGE_EN_COURS':
        color = '#2196f3';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="${color}" viewBox="0 0 16 16">
          <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
        </svg>`;
        break;
      case 'RETOUR_PROCHE':
        color = '#4caf50';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="${color}" viewBox="0 0 16 16">
          <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
        </svg>`;
        break;
      case 'CONGE_APPROUVE':
        color = '#1976d2';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="${color}" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>`;
        break;
      default:
        color = '#007bff';
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="${color}" viewBox="0 0 16 16">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /**
   * Retourne l'icône appropriée selon le type de notification (fallback Bootstrap Icons)
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