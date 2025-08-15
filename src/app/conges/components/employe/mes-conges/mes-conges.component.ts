import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DemandeCongeResponseDto, StatutDemandeConge, TypeConge } from '../../../models/demande-conge.model';
import { CongeService } from '../../../services/conge.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-mes-conges',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mes-conges.component.html',
  styleUrls: ['./mes-conges.component.css']
})
export class MesCongesComponent implements OnInit, OnDestroy {
  demandes: DemandeCongeResponseDto[] = [];
  demandesFiltrees: DemandeCongeResponseDto[] = [];

  isLoading = true;
  error: string | null = null;


    // Pagination
    currentPage = 0;
    itemsPerPage = 10;
    totalItems = 0;
    totalPages = 0;

    // Filtres
    filtreStatut: string = 'TOUS';
    filtreAnnee: number = new Date().getFullYear();
    searchText: string = '';

  // Statistiques
  stats = {
    total: 0,
    enAttente: 0,
    approuvees: 0,
    refusees: 0,
    annulees: 0
  };

  private readonly destroy$ = new Subject<void>();
 public readonly congeService = inject(CongeService);
  private  readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);
 private readonly router = inject(Router);

  ngOnInit(): void {
    // Vérifier que l'utilisateur est bien un employé
    if (this.authService.hasRole('EMPLOYE')) {
      this.loadMesDemandesConges();
    } else {
      this.error = 'Accès non autorisé. Vous devez être employé pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

loadMesDemandesConges(resetPage: boolean = false): void {
    if (resetPage) {
        this.currentPage = 0;
    }

    this.isLoading = true;
    this.error = null;

    this.congeService.getMesDemandesConges({
        page: this.currentPage,
        size: this.itemsPerPage,
        statut: this.filtreStatut,
        year: this.filtreAnnee,
        searchTerm: this.searchText
    }).pipe(
        takeUntil(this.destroy$)
    ).subscribe({
        next: (response) => {
            // ✅ Gestion robuste de la réponse
            this.demandes = response?.content || [];
            this.totalItems = response?.totalElements || 0;
            this.totalPages = response?.totalPages || 0;
            this.currentPage = response?.pageNumber || 0;

            this.calculerStatistiques();
            this.applyFilters();

            // ✅ Message approprié pour le cas vide
            if (this.demandes.length === 0) {
                this.toastrService.info('Aucune demande de congé trouvée', 'Information');
            } else {
                this.toastrService.success(
                    `${this.demandes.length} demande(s) chargée(s)`,
                    'Chargement réussi'
                );
            }

            this.isLoading = false;
        },
        error: (error) => {
            console.error('❌ Erreur chargement demandes:', error);

            // ✅ Initialiser avec des valeurs par défaut
            this.demandes = [];
            this.demandesFiltrees = [];
            this.totalItems = 0;
            this.totalPages = 0;
            this.calculerStatistiques();

            this.error = 'Impossible de charger vos demandes de congé. Veuillez réessayer.';
            this.toastrService.error(this.error, 'Erreur de chargement');
            this.isLoading = false;
        }
    });
}

applyFilters(): void {


    this.demandesFiltrees = this.demandes.filter(demande => {
        const matchStatut = this.filtreStatut === 'TOUS' || demande.statut === this.filtreStatut;
        const matchAnnee = new Date(demande.dateDebut).getFullYear() === this.filtreAnnee;
        const matchSearch = !this.searchText ||
            this.congeService.getTypeCongeLabel(demande.typeConge).toLowerCase().includes(this.searchText.toLowerCase()) ||
            (demande.motifRejet?.toLowerCase() || '').includes(this.searchText.toLowerCase()) ||
            (demande.raison?.toLowerCase() || '').includes(this.searchText.toLowerCase());


        return matchStatut && matchAnnee && matchSearch;
    });

    // Trier par date de demande (plus récent en premier)
    this.demandesFiltrees.sort((a, b) =>
        new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());

 }
    // Méthodes de filtrage
    changerFiltreStatut(statut: string): void {
        this.filtreStatut = statut;
        this.loadMesDemandesConges(true);
    }

    changerFiltreAnnee(annee: number): void {
        this.filtreAnnee = annee;
        this.loadMesDemandesConges(true);
    }

    onSearch(): void {
        this.loadMesDemandesConges(true);
    }

    clearSearch(): void {
        this.searchText = '';
        this.loadMesDemandesConges(true);
    }

    // Navigation pagination
    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
            this.loadMesDemandesConges();
        }
    }



  calculerStatistiques(): void {
    this.stats.total = this.demandes.length;
    this.stats.enAttente = this.demandes.filter(d => d.statut === StatutDemandeConge.EN_ATTENTE).length;
    this.stats.approuvees = this.demandes.filter(d => d.statut === StatutDemandeConge.APPROUVEE).length;
    this.stats.refusees = this.demandes.filter(d => d.statut === StatutDemandeConge.REJETEE).length;
    this.stats.annulees = this.demandes.filter(d => d.statut === StatutDemandeConge.ANNULEE).length;
  }

  appliquerFiltres(): void {
    this.demandesFiltrees = this.demandes.filter(demande => {
      const matchStatut = this.filtreStatut === 'TOUS' || demande.statut === this.filtreStatut;
      const matchAnnee = new Date(demande.dateDebut).getFullYear() === this.filtreAnnee;
      const matchSearch = !this.searchText ||
        this.congeService.getTypeCongeLabel(demande.typeConge).toLowerCase().includes(this.searchText.toLowerCase()) ||
        (demande.motifRejet?.toLowerCase() || '').includes(this.searchText.toLowerCase());

      return matchStatut && matchAnnee && matchSearch;
    });

    // Trier par date de demande (plus récent en premier)
    this.demandesFiltrees.sort((a, b) =>
      new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());
  }



  getAnneesDisponibles(): number[] {
    const annees = new Set<number>();
    const anneeActuelle = new Date().getFullYear();

    // Ajouter l'année actuelle par défaut
    annees.add(anneeActuelle);

    // Ajouter les années des demandes
    this.demandes.forEach(demande => {
      annees.add(new Date(demande.dateDebut).getFullYear());
    });

    return Array.from(annees).sort((a, b) => b - a);
  }

  //   Utilisation des méthodes utilitaires du service unifié
  getStatutClass(statut: StatutDemandeConge): string {
    return this.congeService.getStatutClass(statut);
  }

  getStatutLabel(statut: StatutDemandeConge): string {
    return this.congeService.getStatutLabel(statut);
  }

  getTypeCongeLabel(type: TypeConge): string {
    return this.congeService.getTypeCongeLabel(type);
  }

  peutAnnuler(demande: DemandeCongeResponseDto): boolean {
    return this.congeService.peutAnnulerDemande(demande);
  }

  annulerDemande(demande: DemandeCongeResponseDto): void {
    if (!this.peutAnnuler(demande)) {
      this.toastrService.warning('Cette demande ne peut pas être annulée.', 'Action impossible');
      return;
    }

    const confirmation = confirm(
      `Êtes-vous sûr de vouloir annuler cette demande de congé du ${this.congeService.formatDate(demande.dateDebut)} au ${this.congeService.formatDate(demande.dateFin)} ?`
    );

    if (confirmation) {
      this.congeService.annulerDemande(demande.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.data) {
              this.toastrService.success('Demande annulée avec succès', 'Succès');
              this.loadMesDemandesConges(); // Recharger la liste
            } else {
              this.toastrService.error(response.message || 'Erreur lors de l\'annulation', 'Erreur');
            }
          },
          error: (error) => {
            console.error('Erreur annulation:', error);
            this.toastrService.error(
              error.message || 'Erreur lors de l\'annulation de la demande.',
              'Erreur'
            );
          }
        });
    }
  }

  refresh(): void {
    this.loadMesDemandesConges();
  }

  // Méthode de tracking pour optimiser le rendu
  trackByDemandeId(index: number, demande: DemandeCongeResponseDto): number {
    return demande.id;
  }

  // Utilisation de la méthode du service unifié
  calculerJoursOuvrables(dateDebut: string, dateFin: string): number {
    return this.congeService.calculerJoursOuvrables(dateDebut, dateFin);
  }

  truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

getFiltreLabel(): string {
  if (this.filtreStatut === 'TOUS') return 'Toutes les demandes';
  return this.getStatutLabel(this.filtreStatut as StatutDemandeConge);
}


naviguerVersNouvelleDemandeAbsolue(): void {
  this.router.navigate(['/dashboard/conges/nouvelle-demande']);
}


getPagesArray(): number[] {
    const pageCount = this.totalPages;
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;

    if (pageCount <= maxVisiblePages) {
        return Array.from({length: pageCount}, (_, i) => i);
    }

    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages/2), 0);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage >= pageCount) {
        endPage = pageCount - 1;
        startPage = Math.max(endPage - maxVisiblePages + 1, 0);
    }

    return Array.from(
        {length: endPage - startPage + 1},
        (_, i) => startPage + i
    );
}


getMin(a: number, b: number): number {
  return Math.min(a, b);
}



}
