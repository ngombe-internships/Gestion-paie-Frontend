import { Component, inject, OnInit } from '@angular/core';
import { BulletinPaieEmployeurDto, BulletinService } from '../../services/bulletin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ApiResponse } from '../../model/ApiResponse';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bulletin-list',
  imports: [CommonModule],
  templateUrl: './bulletin-list.component.html',
  styleUrl: './bulletin-list.component.css'
})
export class BulletinListComponent implements OnInit {
  bulletins: BulletinPaieEmployeurDto[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  private readonly bulletinService = inject(BulletinService);
  private readonly authService = inject(AuthService);
  private readonly router = inject (Router);
  private readonly toastrService = inject(ToastrService);


  ngOnInit(): void {
    if (this.authService.hasRole('EMPLOYEUR')){
     this.fetchEmployeurBulletins();
  } else {
    this.error = 'Acces non autorise. Vous devez etre un employeur pour voir cette Page.';
    this.isLoading = false;
    this.router.navigate(['/access-denied']);
  }
  }

    fetchEmployeurBulletins(): void {
    this.isLoading = true;
     // S'assurer que le service retourne bien une ApiResponse<BulletinPaieEmployeurDto[]>
     this.bulletinService.getBulletinsForEmployeur().subscribe({
      next: (data ) => { // Utilisez response.data
      // IMPORTANT: Assurez-vous d'assigner response.data et non la response entière si votre service renvoie ApiResponse
      this.bulletins = data; // Assignation directe des données du backend
      console.log('Bulletins reçus:', this.bulletins);
      this.isLoading = false;
        console.log('Bulletins pour Employeur:', this.bulletins);
       },
        error: (err) => {
       this.error = 'Erreur lors du chargement des bulletins: ' + (err.error?.message || err.message || 'Une erreur inconnue est survenue.');
       this.isLoading = false;
       console.error('Erreur de service:', err);
       }
     });
   }

  // Méthodes d'action existantes (viewBulletin, validerBulletin, etc.)
  viewBulletin(id: number): void {
    this.router.navigate(['/dashboard/bulletins', id]);
  }

  validerBulletin(id: number): void {
    this.bulletinService.validerBulletin(id).subscribe({
      next: (response) => {
        const index = this.bulletins.findIndex(b => b.id === id);
        if (index !== -1) {
          this.bulletins[index].statusBulletin = response.data.statusBulletin; // Met à jour le statut du DTO de réponse
        }
        // Afficher une notification de succès
       this.toastrService.success('Bulletin validé avec succès.');
        // Recharger les bulletins pour s'assurer de l'état le plus récent (optionnel, selon le besoin)
         this.fetchEmployeurBulletins();
      },
      error: (err) => {
       this.toastrService.error('Erreur lors de la validation du bulletin: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  envoyerBulletin(id: number): void {
    this.bulletinService.envoyerBulletin(id).subscribe({
      next: (response) => {
        const index = this.bulletins.findIndex(b => b.id === id);
        if (index !== -1) {
          this.bulletins[index].statusBulletin = response.data.statusBulletin;
           this.fetchEmployeurBulletins();
        }
        this.toastrService.success('Bulletin envoyé avec succès.');
      },
      error: (err) => {
        this.toastrService.error('Erreur lors de l\'envoi du bulletin: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  archiverBulletin(id: number): void {
    this.bulletinService.archiverBulletin(id).subscribe({
      next: (response) => {
        const index = this.bulletins.findIndex(b => b.id === id);
        if (index !== -1) {
          this.bulletins[index].statusBulletin= response.data.statusBulletin;
            this.fetchEmployeurBulletins();
        }
        this.toastrService.success('Bulletin archivé avec succès.');
      },
      error: (err) => {
        this.toastrService.error('Erreur lors de l\'archivage du bulletin: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  annulerBulletin(id: number): void {
    this.bulletinService.annulerBulletin(id).subscribe({
      next: (response) => {
        const index = this.bulletins.findIndex(b => b.id === id);
        if (index !== -1) {
          this.bulletins[index].statusBulletin = response.data.statusBulletin;
        }
       this.toastrService.success('Bulletin annulé avec succès.');
         this.fetchEmployeurBulletins();
      },
      error: (err) => {
       this.toastrService.error('Erreur lors de l\'annulation du bulletin: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  downloadPdf(id: number): void {
    this.bulletinService.downloadBulletinPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin_paie_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.toastrService.success('Téléchargement du PDF réussi.');
      },
      error: (err) => {
       this.toastrService.error('Erreur lors du téléchargement du PDF: ' + (err.error?.message || err.message || 'Le fichier PDF n\'a pas pu être généré ou trouvé.'));
        console.error(err);
      }
    });
  }

  // Fonctions pour gérer la visibilité des boutons selon le statut
  canValidate(bulletin: BulletinPaieEmployeurDto): boolean {
    return bulletin.statusBulletin === 'GÉNÉRÉ';
  }

  canSend(bulletin: BulletinPaieEmployeurDto): boolean {
    return bulletin.statusBulletin === 'VALIDÉ';
  }

  canArchive(bulletin: BulletinPaieEmployeurDto): boolean {
    return bulletin.statusBulletin === 'ENVOYÉ';
  }

  canCancel(bulletin: BulletinPaieEmployeurDto): boolean {
    return bulletin.statusBulletin=== 'GÉNÉRÉ' || bulletin.statusBulletin=== 'VALIDÉ';
  }

  canDownload(bulletin: BulletinPaieEmployeurDto): boolean {
    return bulletin.statusBulletin=== 'ENVOYÉ' || bulletin.statusBulletin === 'ARCHIVÉ';
  }

  // Pour supprimer, généralement accessible seulement à l'ADMIN ou avec une logique spécifique
  deleteBulletin(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bulletin ? Cette action est irréversible.')) {
      this.bulletinService.deleteBulletin(id).subscribe({
        next: () => {
          this.bulletins = this.bulletins.filter(b => b.id !== id);
          alert('Bulletin supprimé avec succès.');
        },
        error: (err) => {
          alert('Erreur lors de la suppression du bulletin: ' + (err.error?.message || err.message));
          console.error(err);
        }
      });
    }
  }

}
