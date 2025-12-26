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
  templateUrl:  './mes-conges.component.html',
  styleUrls: ['./mes-conges.component.css']
})
export class MesCongesComponent implements OnInit, OnDestroy {
  demandes:  DemandeCongeResponseDto[] = [];
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
  searchText:  string = '';

  // Pour l'affichage
  readonly anneeActuelle:  number = new Date().getFullYear();

  // Statistiques (calculées sur TOUTES les demandes, pas les filtrées)
  stats = {
    total: 0,
    enAttente: 0,
    approuvees: 0,
    refusees: 0,
    annulees: 0
  };

  // Variables pour le modal d'annulation
  showModalAnnulation = false;
  demandeAnnuler: DemandeCongeResponseDto | null = null;
  annulationEnCours = false;

  private readonly destroy$ = new Subject<void>();
  public readonly congeService = inject(CongeService);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.hasRole('EMPLOYE')) {
      // Charger d'abord les stats globales, puis les demandes filtrées
      this.loadStatistiquesGlobales();
      this.loadMesDemandesConges();
    } else {
      this.error = 'Accès non autorisé.  Vous devez être employé pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Charger les statistiques globales (toutes les demandes de l'année)
   */
  loadStatistiquesGlobales(): void {
    this.congeService.getMesDemandesConges({
      page: 0,
      size: 1000, // Récupérer toutes les demandes pour les stats
      statut:  'TOUS',
      year: this. filtreAnnee > 0 ? this.filtreAnnee : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const allDemandes = this.extractContent(response);
        this.calculerStatistiques(allDemandes);
      },
      error: (err:  any) => {
        console.error('Erreur chargement stats:', err);
      }
    });
  }

  /**
   * ✅ Charger les demandes avec filtres
   */
  loadMesDemandesConges(resetPage:  boolean = false): void {
    if (resetPage) {
      this.currentPage = 0;
    }

    this.isLoading = true;
    this.error = null;

    console.log('🔄 Chargement des demandes de congés...');

    const params:  any = {
      page: this.currentPage,
      size: this.itemsPerPage,
      searchTerm: this. searchText
    };

    // Ajouter le statut seulement si ce n'est pas "TOUS"
    if (this.filtreStatut && this.filtreStatut !== 'TOUS') {
      params.statut = this.filtreStatut;
    }

    // Ajouter l'année seulement si > 0
    if (this.filtreAnnee && this.filtreAnnee > 0) {
      params.year = this. filtreAnnee;
    }

    console.log('📤 Paramètres envoyés:', params);

    this.congeService.getMesDemandesConges(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ Réponse brute reçue:', response);

        const content = this.extractContent(response);
        console.log('📋 Demandes extraites:', content.length, content);

        this.demandes = content;
        this. demandesFiltrees = [... content]; // ✅ Copie directe, pas de re-filtrage ! 
        
        this.totalItems = response?. totalElements || response?.data?.totalElements || content.length;
        this.totalPages = response?.totalPages || response?.data?.totalPages || 1;
        this.currentPage = response?.pageNumber || response?.data?.number || 0;

        // Trier par date de demande (plus récent en premier)
        this.demandesFiltrees.sort((a, b) =>
          new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime()
        );

        this.isLoading = false;
      },
      error: (error:  any) => {
        console.error('❌ Erreur chargement demandes:', error);
        this.demandes = [];
        this.demandesFiltrees = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.error = 'Impossible de charger vos demandes de congé. ';
        this. toastrService.error(this.error, 'Erreur');
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ Extraire le contenu de la réponse API
   */
  private extractContent(response: any): DemandeCongeResponseDto[] {
    if (response?.content) {
      return response.content;
    } else if (response?. data?.content) {
      return response. data.content;
    } else if (Array.isArray(response?. data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  /**
   * ✅ Calculer les statistiques sur un ensemble de demandes
   */
  calculerStatistiques(demandes: DemandeCongeResponseDto[]): void {
    this.stats. total = demandes. length;
    this.stats.enAttente = demandes. filter(d => d.statut === StatutDemandeConge.EN_ATTENTE).length;
    this.stats.approuvees = demandes. filter(d => d.statut === StatutDemandeConge.APPROUVEE).length;
    this.stats. refusees = demandes.filter(d => d.statut === StatutDemandeConge. REJETEE).length;
    this.stats. annulees = demandes.filter(d => d.statut === StatutDemandeConge. ANNULEE).length;
  }

  // ===== MÉTHODES DE FILTRAGE =====

  changerFiltreStatut(statut: string): void {
    this. filtreStatut = statut;
    this.loadMesDemandesConges(true);
  }

  changerFiltreAnnee(annee: number): void {
    this. filtreAnnee = annee;
    this.loadStatistiquesGlobales(); // Recharger les stats pour la nouvelle année
    this.loadMesDemandesConges(true);
  }

  revenirAnneeActuelle(): void {
    this.filtreAnnee = this.anneeActuelle;
    this. loadStatistiquesGlobales();
    this.loadMesDemandesConges(true);
  }

  afficherToutesLesAnnees(): void {
    this.filtreAnnee = 0;
    this. loadStatistiquesGlobales();
    this.loadMesDemandesConges(true);
  }

  reinitialiserFiltres(): void {
    this. filtreStatut = 'TOUS';
    this.filtreAnnee = this.anneeActuelle;
    this. searchText = '';
    this.loadStatistiquesGlobales();
    this.loadMesDemandesConges(true);
  }

  estAnneeActuelle(): boolean {
    return this. filtreAnnee === this.anneeActuelle;
  }

  afficheToutesAnnees(): boolean {
    return this.filtreAnnee === 0;
  }

  getAnneeLabel(): string {
    if (this.filtreAnnee === 0) {
      return 'Toutes les années';
    }
    return this.filtreAnnee. toString();
  }

  onSearch(): void {
    this.loadMesDemandesConges(true);
  }

  clearSearch(): void {
    this.searchText = '';
    this. loadMesDemandesConges(true);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this. totalPages) {
      this.currentPage = page;
      this.loadMesDemandesConges();
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  getAnneesDisponibles(): { value: number; label:  string }[] {
    const annees:  { value: number; label: string }[] = [];
    const anneeActuelle = new Date().getFullYear();

    annees.push({ value: 0, label: 'Toutes les années' });

    for (let i = 0; i <= 3; i++) {
      const annee = anneeActuelle - i;
      annees.push({ value: annee, label: annee.toString() });
    }

    return annees;
  }

  getStatutClass(statut: StatutDemandeConge | string): string {
    return this.congeService.getStatutClass(statut as StatutDemandeConge);
  }

  getStatutLabel(statut: StatutDemandeConge | string): string {
    return this.congeService. getStatutLabel(statut as StatutDemandeConge);
  }

  getStatutFiltreLabel(): string {
    if (this.filtreStatut === 'TOUS') {
      return 'Tous les statuts';
    }
    return this.getStatutLabel(this.filtreStatut as StatutDemandeConge);
  }

  getTypeCongeLabel(type: TypeConge): string {
    return this.congeService.getTypeCongeLabel(type);
  }

  peutAnnuler(demande: DemandeCongeResponseDto): boolean {
    if (! demande) return false;
    return demande.statut === StatutDemandeConge.EN_ATTENTE;
  }

  annulerDemande(demande: DemandeCongeResponseDto): void {
    if (!this.peutAnnuler(demande)) {
      this.toastrService.warning('Cette demande ne peut pas être annulée. ', 'Action impossible');
      return;
    }

    const confirmation = confirm(
      `Êtes-vous sûr de vouloir annuler cette demande de congé du ${this.congeService.formatDate(demande.dateDebut)} au ${this.congeService.formatDate(demande.dateFin)} ?`
    );

    if (confirmation) {
      this.congeService. annulerDemande(demande. id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response. data) {
              this. toastrService. success('Demande annulée avec succès', 'Succès');
              this. loadStatistiquesGlobales();
              this.loadMesDemandesConges();
            } else {
              this.toastrService.error(response.message || 'Erreur lors de l\'annulation', 'Erreur');
            }
          },
          error: (error:  any) => {
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
    this.loadStatistiquesGlobales();
    this.loadMesDemandesConges();
  }

  trackByDemandeId(index: number, demande: DemandeCongeResponseDto): number {
    return demande.id;
  }

  calculerJoursOuvrables(dateDebut: string, dateFin: string): number {
    return this.congeService. calculerJoursOuvrables(dateDebut, dateFin);
  }

  truncateText(text: string, maxLength: number): string {
    if (! text) return '';
    return text. length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getFiltreLabel(): string {
    if (this.filtreStatut === 'TOUS') return 'Toutes les demandes';
    return this.getStatutLabel(this.filtreStatut as StatutDemandeConge);
  }

  naviguerVersNouvelleDemandeAbsolue(): void {
    this.router. navigate(['/dashboard/conges/nouvelle-demande']);
  }

  getPagesArray(): number[] {
    const pageCount = this.totalPages;
    const currentPage = this. currentPage;
    const maxVisiblePages = 5;

    if (pageCount <= maxVisiblePages) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }

    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 0);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage >= pageCount) {
      endPage = pageCount - 1;
      startPage = Math. max(endPage - maxVisiblePages + 1, 0);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  getMin(a: number, b:  number): number {
    return Math.min(a, b);
  }

  // ===== MODAL D'ANNULATION =====

  ouvrirModalAnnulation(demande: DemandeCongeResponseDto): void {
    if (! this.peutAnnuler(demande)) {
      this.toastrService.warning('Cette demande ne peut pas être annulée.', 'Action impossible');
      return;
    }

    this.demandeAnnuler = demande;
    this.showModalAnnulation = true;
    console.log('📋 Ouverture modal annulation pour demande:', demande.id);
  }

  fermerModalAnnulation(): void {
    this.showModalAnnulation = false;
    this.demandeAnnuler = null;
    this.annulationEnCours = false;
  }

  confirmerAnnulation(): void {
    if (! this.demandeAnnuler) {
      return;
    }

    this.annulationEnCours = true;
    const demandeId = this.demandeAnnuler.id;
    const demandeInfo = `${this.getTypeCongeLabel(this.demandeAnnuler. typeConge)} du ${this.congeService.formatDateShort(this.demandeAnnuler.dateDebut)} au ${this.congeService.formatDateShort(this.demandeAnnuler.dateFin)}`;

    console.log('🗑️ Début annulation demande:', demandeId);

    this.congeService.annulerDemande(demandeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Annulation réussie:', response);

          if (response. data) {
            this.toastrService.success(
              `Demande annulée avec succès :  ${demandeInfo}`,
              'Annulation confirmée'
            );

            this.fermerModalAnnulation();
            this.loadStatistiquesGlobales();
            this.loadMesDemandesConges();
          } else {
            this.toastrService.error(
              response.message || 'Erreur lors de l\'annulation',
              'Erreur'
            );
            this.annulationEnCours = false;
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur annulation:', error);

          let errorMessage = 'Erreur lors de l\'annulation de la demande.';

          if (error. error?. message) {
            errorMessage = error. error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.toastrService.error(errorMessage, 'Erreur d\'annulation');
          this.annulationEnCours = false;
        }
      });
  }
}