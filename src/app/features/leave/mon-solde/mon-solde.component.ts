import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { HistoriqueCongeDto, SoldeCongeDto } from '../models/solde-conge.model';
import { EmployeService } from '../../../../services/employe.service';
import { CongeService } from '../../../conges/services/conge.service';

@Component({
  selector: 'app-mon-solde',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mon-solde.component.html',
  styleUrls: ['./mon-solde.component.css']
})
export class MonSoldeComponent implements OnInit, OnDestroy {
  solde: SoldeCongeDto | null = null;
  historique: HistoriqueCongeDto[] = [];

  isLoading = true;
  isHistoriqueLoading = false;
  error: string | null = null;
  historiqueError: string | null = null;

  showHistorique = false;

  // Statistiques calculées
  stats = {
    pourcentageUtilise: 0,
    joursRestants: 0,
    ancienneteAnnees: 0,
    prochainDroitDate: new Date()
  };

  private destroy$ = new Subject<void>();
  private soldeService = inject(CongeService)
  private authService = inject(AuthService);
  private toastrService = inject(ToastrService);
  private readonly router = inject(Router);


  ngOnInit(): void {
    if (this.authService.hasRole('EMPLOYE')) {
      this.loadMonSolde();
    } else {
      this.error = 'Accès non autorisé. Vous devez être employé pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMonSolde(): void {
    this.isLoading = true;
    this.error = null;

    this.soldeService.getMonSolde()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.solde = response.data;
            this.calculerStatistiques();
            this.toastrService.success('Solde chargé avec succès', 'Chargement réussi');
          } else {
            this.error = response.message || 'Erreur lors du chargement du solde.';
            this.toastrService.error(this.error || '', 'Erreur');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement solde:', error);
          this.error = error.message || 'Erreur lors du chargement du solde.';
          this.toastrService.error(this.error || '', 'Erreur de chargement');
          this.isLoading = false;
        }
      });
  }

  loadHistorique(): void {
    if (!this.solde) return;

    this.isHistoriqueLoading = true;
    this.historiqueError = null;

    this.soldeService.getHistoriqueConges(this.solde.employeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.historique = response.data;
            this.toastrService.success(`${this.historique.length} entrée(s) d'historique chargée(s)`, 'Historique chargé');
          } else {
            this.historiqueError = response.message || 'Erreur lors du chargement de l\'historique.';
            this.toastrService.error(this.historiqueError || '', 'Erreur');
          }
          this.isHistoriqueLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement historique:', error);
          this.historiqueError = error.message || 'Erreur lors du chargement de l\'historique.';
          this.toastrService.error(this.historiqueError || '', 'Erreur de chargement');
          this.isHistoriqueLoading = false;
        }
      });
  }

  calculerStatistiques(): void {
    if (!this.solde) return;

    // Pourcentage utilisé
    const soldeTotalAcquis = this.solde.soldeAcquisTotal;
    const soldePris = this.solde.soldePris;

    this.stats.pourcentageUtilise = soldeTotalAcquis > 0
      ? Math.round((soldePris / soldeTotalAcquis) * 100)
      : 0;

    // Jours restants
    this.stats.joursRestants = this.solde.soldeDisponible;

    // Ancienneté
    if (this.solde.dateEmbauche) {
      const dateEmbauche = new Date(this.solde.dateEmbauche);
      const maintenant = new Date();
      this.stats.ancienneteAnnees = maintenant.getFullYear() - dateEmbauche.getFullYear();

      // Ajustement si l'anniversaire d'embauche n'est pas encore passé cette année
      if (
        maintenant.getMonth() < dateEmbauche.getMonth() ||
        (maintenant.getMonth() === dateEmbauche.getMonth() &&
         maintenant.getDate() < dateEmbauche.getDate())
      ) {
        this.stats.ancienneteAnnees--;
      }
    }

    // Date du prochain droit (début de l'année suivante)
    const maintenant = new Date();
    this.stats.prochainDroitDate = new Date(maintenant.getFullYear() + 1, 0, 1);
  }

  // Méthodes utilitaires
  getCouleurBadgeSolde(): string {
    if (!this.solde) return 'secondary';

    const pourcentage = this.getPourcentageSolde();

    if (pourcentage >= 70) return 'success';
    if (pourcentage >= 30) return 'warning';
    return 'danger';
  }

  getPourcentageSolde(): number {
    if (!this.solde || this.solde.soldeAcquisTotal === 0) return 0;

    return Math.round((this.solde.soldeDisponible / this.solde.soldeAcquisTotal) * 100);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  toggleHistorique(): void {
    if (!this.showHistorique && this.historique.length === 0) {
      this.loadHistorique();
    } else {
      this.showHistorique = !this.showHistorique;
    }
  }

  refresh(): void {
    this.loadMonSolde();
    if (this.showHistorique) {
      this.loadHistorique();
    }
  }

  getStatutClass(statut: string): string {
  const classes: { [key: string]: string } = {
    'EN_ATTENTE': 'warning',
    'APPROUVEE': 'success',
    'REJETEE': 'danger',
    'ANNULEE': 'secondary'
  };
  return classes[statut] || 'secondary';
}

naviguerVersNouvelleDemandeAbsolue(): void {
  this.router.navigate(['/dashboard/conges/nouvelle-demande']);
}

}
