import { Component, inject, OnInit } from '@angular/core';
import { BulletinPaieEmployeurDto, BulletinService } from '../../services/bulletin.service';
import { Router } from '@angular/router';
import { ApiResponse } from '../../../../shared/models/ApiResponse';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-bulletin-list',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './bulletin-list.component.html',
  styleUrl: './bulletin-list.component.css'
})
export class BulletinListComponent implements OnInit {
  bulletins: BulletinPaieEmployeurDto[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  searchText: string = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  statutFilter = 'ACTIFS';

  // Mapping options (label, value, backend status list)
  statutOptions = [
    { label: 'Actifs', value: 'ACTIFS', backend: ['GÉNÉRÉ', 'VALIDÉ', 'ENVOYÉ'] },
    { label: 'Archivés', value: 'ARCHIVÉS', backend: ['ARCHIVÉ'] },
    { label: 'Annulés', value: 'ANNULÉS', backend: ['ANNULÉ'] }
  ];

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

  getStatutList(): string[] {
    const found = this.statutOptions.find(opt => opt.value === this.statutFilter);
    return found ? found.backend : ['GÉNÉRÉ', 'VALIDÉ', 'ENVOYÉ'];
  }

  fetchEmployeurBulletins(): void {
    this.isLoading = true;
    this.error = '';
    this.bulletinService.getBulletinsForEmployeurPaginated(
      this.currentPage, this.pageSize, this.searchText, this.getStatutList()
    ).subscribe({
      next: (response) => {
        this.bulletins = response.data.content;
        this.totalPages = response.data.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des bulletins.";
        this.isLoading = false;
      }
    });
  }

  searchBulletins() {
    this.currentPage = 0;
    this.fetchEmployeurBulletins();
  }

  viewBulletin(id: number): void {
    this.router.navigate(['/dashboard/bulletins', id]);
  }

  validerBulletin(id: number): void {
    this.bulletinService.validerBulletin(id).subscribe({
      next: (response) => {
        const index = this.bulletins.findIndex(b => b.id === id);
        if (index !== -1) {
          this.bulletins[index].statusBulletin = response.data.statusBulletin;
        }
        this.toastrService.success('Bulletin validé avec succès.');
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
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetchEmployeurBulletins();
    }
  }
  filterByStatut(statut: string) {
    this.statutFilter = statut;
    this.currentPage = 0;
    this.fetchEmployeurBulletins();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.fetchEmployeurBulletins();
  }
}
