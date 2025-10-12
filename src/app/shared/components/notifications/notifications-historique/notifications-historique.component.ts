import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiResponse } from '../../../models/ApiResponse';
import { NotificationDto, NotificationService } from '../../../../features/leave/services/notification.service';

interface PaginatedNotifications {
  content: NotificationDto[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Component({
  selector: 'app-notifications-historique',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-historique.component.html',
  styleUrls: ['./notifications-historique.component.css']
})
export class NotificationsHistoriqueComponent implements OnInit {
  notifications: NotificationDto[] = [];
  loading = true;
  currentPage = 0;
  totalPages = 0;
  pageSize = 20;

  // Variables pour le modal
  selectedNotification: NotificationDto | null = null;
  showModal = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications(page = 0) {
    this.loading = true;
    console.log('Chargement des notifications, page:', page);

    this.notificationService.loadAllNotifications(page, this.pageSize).subscribe({
      next: (response: ApiResponse<PaginatedNotifications>) => {
        console.log('Réponse reçue:', response);

        // ✅ Vérifications de sécurité pour éviter les erreurs null
        if (response && response.data) {
          const data = response.data;
          this.notifications = data.content || [];
          this.totalPages = data.totalPages || 0;
          this.currentPage = page;

          console.log(`Notifications chargées: ${this.notifications.length}`);
        } else {
          console.warn('Réponse invalide:', response);
          this.notifications = [];
          this.totalPages = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.notifications = [];
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadNotifications(page);
    }
  }

  marquerCommeLu(notification: NotificationDto) {
    if (!notification.lu) {
      this.notificationService.marquerCommeLu(notification.id).subscribe({
        next: () => {
          // Mettre à jour localement
          notification.lu = true;
          console.log(`Notification ${notification.id} marquée comme lue`);
        },
        error: (error) => {
          console.error('Erreur lors du marquage comme lu:', error);
        }
      });
    }
  }

  // Ouvrir le modal avec les détails
  openDetailModal(notification: NotificationDto) {
    this.selectedNotification = notification;
    this.showModal = true;

    // Marquer comme lu si ce n'est pas encore fait
    this.marquerCommeLu(notification);
  }

  // Fermer le modal
  closeModal() {
    this.showModal = false;
    this.selectedNotification = null;
  }

  // ✅ TrackBy function pour éviter les erreurs
  trackById(index: number, notification: NotificationDto): number {
    return notification.id;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DEMANDE_CONGE_SOUMISE': return 'bi-calendar-plus text-warning';
      case 'DEMANDE_CONGE_APPROUVEE': return 'bi-calendar-check text-success';
      case 'DEMANDE_CONGE_REJETEE': return 'bi-calendar-x text-danger';
      case 'BULLETIN_PAIE_DISPONIBLE': return 'bi-file-earmark-text text-info';
      default: return 'bi-bell text-primary';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'DEMANDE_CONGE_SOUMISE': return 'warning';
      case 'DEMANDE_CONGE_APPROUVEE': return 'success';
      case 'DEMANDE_CONGE_REJETEE': return 'danger';
      case 'BULLETIN_PAIE_DISPONIBLE': return 'info';
      default: return 'primary';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR');
  }

  // ✅ Méthode pour gérer les valeurs null dans le template
  getNotificationTypeDisplay(type: string | null | undefined): string {
    if (!type) return 'INFORMATION';
    return type.replace('_', ' ');
  }

  // ✅ Méthode pour gérer les liens d'action null
  hasActionLink(notification: NotificationDto): boolean {
    return !!(notification.lienAction || (notification.referenceType === 'DEMANDE_CONGE' && notification.referenceId));
  }
}
