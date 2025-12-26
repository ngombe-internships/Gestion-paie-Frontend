import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationDto, NotificationService, PageResponse } from '../../services/notification.service';

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

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(page: number = 0): void {
    this.loading = true;
    console.log('Chargement des notifications, page:', page);

    this.notificationService.loadAllNotifications(page, this.pageSize).subscribe({
      next: (response: PageResponse<NotificationDto>) => {
        console.log('Réponse reçue:', response);

        if (response) {
          this. notifications = response.content || [];
          this. totalPages = response. totalPages || 0;
          this.currentPage = page;

          console.log(`Notifications chargées: ${this.notifications.length}`);
        } else {
          console.warn('Réponse invalide:', response);
          this.notifications = [];
          this.totalPages = 0;
        }
        this.loading = false;
      },
      error: (error:  any) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.notifications = [];
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadNotifications(page);
    }
  }

  marquerCommeLu(notification: NotificationDto): void {
    if (! notification. lu) {
      this.notificationService.marquerCommeLu(notification.id).subscribe({
        next: () => {
          notification.lu = true;
          console.log(`Notification ${notification.id} marquée comme lue`);
        },
        error:  (error:  any) => {
          console.error('Erreur lors du marquage comme lu:', error);
        }
      });
    }
  }

  openDetailModal(notification: NotificationDto): void {
    this.selectedNotification = notification;
    this.showModal = true;
    this.marquerCommeLu(notification);
  }

  closeModal(): void {
    this.showModal = false;
    this. selectedNotification = null;
  }

  trackById(index: number, notification: NotificationDto): number {
    return notification.id;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DEMANDE_CONGE_SOUMISE':  return 'bi-calendar-plus text-warning';
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

  getNotificationTypeDisplay(type: string | null | undefined): string {
    if (!type) return 'INFORMATION';
    return type.replace('_', ' ');
  }

  hasActionLink(notification: NotificationDto): boolean {
    return ! !(notification.lienAction || (notification.referenceType === 'DEMANDE_CONGE' && notification.referenceId));
  }
}