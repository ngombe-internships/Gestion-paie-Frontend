import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SoldeCongeDto, HistoriqueCongeDto } from '../../models/solde-conge.model';
import { AuthService } from '../../../services/auth.service'; // ✅ Votre AuthService
import { CongeService } from '../../services/conge.service';

@Component({
  selector: 'app-conges-soldes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './conges-soldes.component.html',
  styleUrls: ['./conges-soldes.component.css']
})
export class CongesSoldesComponent implements OnInit, OnDestroy {

  soldes: SoldeCongeDto[] = [];
  soldesFiltres: SoldeCongeDto[] = [];
  isLoading = true;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filtres
  searchTerm = '';
  filterStatus = 'tous';

  // Modal historique
  showHistoryModal = false;
  selectedEmployee: SoldeCongeDto | null = null;
  historique: HistoriqueCongeDto[] = [];
  isLoadingHistory = false;
  lastUpdate: Date = new Date();

  private destroy$ = new Subject<void>();

    public readonly soldeService =  inject (CongeService);
    public readonly  authService=  inject (AuthService) // ✅ Public pour l'utiliser dans le template
  constructor(

  ) {}

  ngOnInit(): void {
    // ✅ Vérifie le rôle avant de charger
    if (this.authService.hasRole('EMPLOYEUR') || this.authService.isAdmin()) {
      this.loadSoldes();
    } else {
      this.error = 'Accès non autorisé. Vous devez être employeur pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSoldes(): void {
    this.isLoading = true;
    this.error = null;

    this.soldeService.getTousSoldesEntreprise()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.soldes = response.data;
            this.applyFilters();
          } else {
            this.error = response.message || 'Erreur lors du chargement des soldes.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des soldes:', error);
          this.error = error.message || 'Erreur lors du chargement des soldes.';
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.soldes];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(solde =>
        solde.nom.toLowerCase().includes(term) ||
        solde.prenom.toLowerCase().includes(term) ||
        solde.matricule.toLowerCase().includes(term)
      );
    }

    // Filtre par niveau de solde
    if (this.filterStatus !== 'tous') {
      filtered = filtered.filter(solde => {
        const pourcentage = this.soldeService.getPourcentageSolde(
          solde.soldeDisponible,
          solde.soldeAcquisTotal
        );
        switch (this.filterStatus) {
          case 'faible': return pourcentage < 30;
          case 'moyen': return pourcentage >= 30 && pourcentage < 70;
          case 'bon': return pourcentage >= 70;
          default: return true;
        }
      });
    }

    this.soldesFiltres = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  getPaginatedItems(): SoldeCongeDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.soldesFiltres.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getBadgeClass(solde: SoldeCongeDto): string {
    return 'badge bg-' + this.soldeService.getCouleurBadgeSolde(
      solde.soldeDisponible,
      solde.soldeAcquisTotal
    );
  }

  getPourcentageSolde(solde: SoldeCongeDto): number {
    return this.soldeService.getPourcentageSolde(
      solde.soldeDisponible,
      solde.soldeAcquisTotal
    );
  }

  getAnciennete(dateEmbauche: string): string {
    const annees = this.soldeService.calculerAnciennete(dateEmbauche);
    return `${annees} an${annees > 1 ? 's' : ''}`;
  }

  formatDate(dateString: string): string {
    return this.soldeService.formatDate(dateString);
  }

  showHistory(employe: SoldeCongeDto): void {
    this.selectedEmployee = employe;
    this.showHistoryModal = true;
    this.loadHistorique(employe.employeId);
  }

  loadHistorique(employeId: number): void {
    this.isLoadingHistory = true;
    this.historique = [];

    this.soldeService.getHistoriqueConges(employeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.historique = response.data;
          }
          this.isLoadingHistory = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error);
          this.isLoadingHistory = false;
        }
      });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedEmployee = null;
    this.historique = [];
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'APPROUVEE': return 'badge bg-success';
      case 'EN_ATTENTE': return 'badge bg-warning';
      case 'REJETEE': return 'badge bg-danger';
      case 'ANNULEE': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  refresh(): void {
    this.loadSoldes();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'tous';
    this.applyFilters();
  }

  // ✅ Méthodes pour les statistiques
  getSoldesParNiveau(niveau: string): number {
    return this.soldes.filter(solde => {
      const pourcentage = this.getPourcentageSolde(solde);
      switch (niveau) {
        case 'faible': return pourcentage < 30;
        case 'moyen': return pourcentage >= 30 && pourcentage < 70;
        case 'bon': return pourcentage >= 70;
        default: return false;
      }
    }).length;
  }

  getMin(a: number, b: number): number {
  return Math.min(a, b);
}

get pages(): number[] {
  return Array(this.getTotalPages()).fill(0).map((x, i) => i + 1);

}

}
