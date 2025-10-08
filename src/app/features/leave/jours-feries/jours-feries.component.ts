import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { ConfigService, JourFerieDto, JourFerieRequestDto } from '../../../conges/services/config.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-jours-feries',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './jours-feries.component.html',
  styleUrls: ['./jours-feries.component.css']
})
export class JoursFeriesComponent implements OnInit, OnDestroy {

  // =============================================
  // PROPRIÉTÉS DU COMPOSANT
  // =============================================

  // Données
  joursFeries: JourFerieDto[] = [];
  joursFeriesFiltres: JourFerieDto[] = [];
  entrepriseId: number | null = null;
  entrepriseNom: string = '';

  // États
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  currentUserRole: string | null = null;

  // Pagination et filtres
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchTerm = '';
  filterAnnee = 'toutes';
  filterType = 'tous';
  sortBy: keyof JourFerieDto = 'dateFerie';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal d'ajout/modification
  showModal = false;
  isEditMode = false;
  selectedJourFerie: JourFerieDto | null = null;
  jourFerieForm!: FormGroup;

  // Modal de suppression - AJOUTER CES 3 LIGNES
showDeleteModal = false;
isDeleting = false;
jourFerieASupprimer: JourFerieDto | null = null;


  private destroy$ = new Subject<void>();

  // Services injectés
  private readonly fb = inject(FormBuilder);
  private readonly configService = inject(ConfigService);
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  //private readonly employeService = inject(EmployeService);
  private readonly router = inject(Router);

  // =============================================
  // CYCLE DE VIE DU COMPOSANT
  // =============================================

  ngOnInit(): void {
    console.log('🚀 Initialisation du composant Jours Fériés');
    this.checkUserAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =============================================
  // VÉRIFICATION D'ACCÈS
  // =============================================

  private checkUserAccess(): void {
    this.currentUserRole = this.authService.getUserRole();

    if (this.currentUserRole !== 'EMPLOYEUR') {
      console.error('❌ Accès refusé - Rôle requis: EMPLOYEUR, Rôle actuel:', this.currentUserRole);
      this.toastrService.error('Accès non autorisé. Cette fonctionnalité est réservée aux employeurs.', 'Accès refusé');
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('✅ Accès autorisé pour EMPLOYEUR');
    this.initializeForm();
    this.getEntrepriseInfo();
  }

  // =============================================
  // INITIALISATION
  // =============================================

  private initializeForm(): void {
    this.jourFerieForm = this.fb.group({
      nom: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      dateFerie: ['', [Validators.required]],
      estChomeEtPaye: [true, [Validators.required]]
    });
  }



  private getEntrepriseInfo(): void {
    // ✅ MÉTHODE 1 : Depuis AuthService (le plus simple)
    this.entrepriseId = this.authService.getEntrepriseId();

    if (this.entrepriseId) {
      console.log(`🏢 Entreprise ID depuis AuthService: ${this.entrepriseId}`);
      this.entrepriseNom = 'Votre entreprise'; // Nom par défaut
      this.loadJoursFeries();
      return;
    }

    // ✅ MÉTHODE 2 : Si pas d'entrepriseId dans AuthService, essayer autre chose
    console.log('⚠️ Pas d\'entrepriseId dans AuthService, chargement des jours fériés pour toutes les entreprises...');
    this.loadJoursFeries(); // Charger tous et filtrer après
  }
  // =============================================
  // CHARGEMENT DES DONNÉES
  // =============================================

   loadJoursFeries(): void {
    this.isLoading = true;
    this.error = null;

    console.log('📅 Chargement direct des jours fériés...');

    // ✅ APPEL DIRECT À L'API DES JOURS FÉRIÉS
    this.configService.getAllJoursFeries()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('📅 Réponse jours fériés:', response);

          if (response.status === 'OK' && response.data) {

            // ✅ SI ON A UN ENTREPRISE ID : FILTRER
            if (this.entrepriseId) {
              this.joursFeries = response.data.filter(
                jour => jour.entrepriseId === this.entrepriseId
              );
              console.log(`📅 ${this.joursFeries.length} jours fériés pour l'entreprise ${this.entrepriseId}`);
            }
            // ✅ SINON : PRENDRE TOUS (cas d'urgence)
            else {
              this.joursFeries = response.data;
              console.log(`📅 ${this.joursFeries.length} jours fériés chargés (toutes entreprises)`);

              // Essayer de déduire l'entrepriseId du premier jour férié
              if (this.joursFeries.length > 0 && this.joursFeries[0].entrepriseId) {
                this.entrepriseId = this.joursFeries[0].entrepriseId;
                this.entrepriseNom = this.joursFeries[0].entrepriseNom || 'Votre entreprise';
                console.log(`🔍 Entreprise déduite: ${this.entrepriseNom} (${this.entrepriseId})`);
              }
            }

            this.applyFilters();

            if (this.joursFeries.length === 0) {
              this.toastrService.info(
                'Aucun jour férié configuré. Commencez par en ajouter un!',
                'Information'
              );
            }
          } else {
            this.handleError('Impossible de charger les jours fériés.');
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement jours fériés:', error);
          this.handleError('Erreur lors du chargement des jours fériés.');
        }
      });
  }


    private createJourFerie(): void {
    const formValue = this.jourFerieForm.value;

    // ✅ OBTENIR L'ENTREPRISE ID POUR LA CRÉATION
    let entrepriseIdToUse = this.entrepriseId;

    // Si pas d'entrepriseId, essayer de le récupérer d'autres façons
    if (!entrepriseIdToUse) {
      entrepriseIdToUse = this.authService.getEntrepriseId();
    }

    if (!entrepriseIdToUse) {
      this.toastrService.error(
        'Impossible de déterminer votre entreprise. Contactez le support.',
        'Erreur'
      );
      this.isSubmitting = false;
      return;
    }

    // Vérifier si la date n'existe pas déjà
    const dateExists = this.joursFeries.some(jour =>
      jour.dateFerie === formValue.dateFerie && jour.entrepriseId === entrepriseIdToUse
    );

    if (dateExists) {
      this.toastrService.error(
        'Un jour férié existe déjà pour cette date dans votre entreprise.',
        'Date déjà utilisée'
      );
      this.isSubmitting = false;
      return;
    }

    const jourFerieRequest: JourFerieRequestDto = {
      nom: formValue.nom.trim(),
      dateFerie: formValue.dateFerie,
      estChomeEtPaye: formValue.estChomeEtPaye,
      entrepriseId: entrepriseIdToUse
    };

    console.log('📝 Création jour férié:', jourFerieRequest);

    this.configService.addJourFerie(jourFerieRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'CREATED' && response.data) {
            this.toastrService.success(
              `Jour férié "${formValue.nom}" ajouté avec succès!`,
              'Succès'
            );

            // ✅ METTRE À JOUR L'ENTREPRISE INFO SI NÉCESSAIRE
            if (!this.entrepriseId && response.data.entrepriseId) {
              this.entrepriseId = response.data.entrepriseId;
              this.entrepriseNom = response.data.entrepriseNom || 'Votre entreprise';
            }

            this.loadJoursFeries();
            this.fermerModal();
          } else {
            this.toastrService.error(
              response.message || 'Erreur lors de l\'ajout',
              'Erreur'
            );
          }
        },
        error: (error) => {
          console.error('❌ Erreur création:', error);
          const message = error.error?.message || 'Erreur lors de l\'ajout du jour férié';
          this.toastrService.error(message, 'Erreur');
        }
      });
    }

  // =============================================
  // GESTION DES FILTRES
  // =============================================

applyFilters(): void {
  let filtered = [...this.joursFeries];

  // Filtre par recherche (nom ou date)
  if (this.searchTerm.trim()) {
    const search = this.searchTerm.toLowerCase().trim();
    filtered = filtered.filter(jour =>
      jour.nom.toLowerCase().includes(search) ||
      this.formatDateShort(jour.dateFerie).includes(search)
    );
  }

  // Filtre par année
  if (this.filterAnnee !== 'toutes') {
    filtered = filtered.filter(jour => {
      const annee = new Date(jour.dateFerie).getFullYear().toString();
      return annee === this.filterAnnee;
    });
  }

  // Filtre par type (payé/non payé)
  if (this.filterType === 'paye') {
    filtered = filtered.filter(jour => jour.estChomeEtPaye);
  } else if (this.filterType === 'non-paye') {
    filtered = filtered.filter(jour => !jour.estChomeEtPaye);
  }

  // Tri des résultats
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (this.sortBy) {
      case 'dateFerie':
        comparison = new Date(a.dateFerie).getTime() - new Date(b.dateFerie).getTime();
        break;
      case 'nom':
        comparison = a.nom.localeCompare(b.nom);
        break;
      case 'estChomeEtPaye':
        comparison = Number(b.estChomeEtPaye) - Number(a.estChomeEtPaye);
        break;
      default:
        comparison = 0;
    }

    return this.sortDirection === 'desc' ? -comparison : comparison;
  });

  this.joursFeriesFiltres = filtered;
  this.totalItems = filtered.length;
  this.currentPage = 1;

  console.log(`🔍 Filtres appliqués: ${filtered.length} résultats sur ${this.joursFeries.length}`);
}

  sort(field: keyof JourFerieDto): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = field === 'dateFerie' ? 'asc' : 'asc';
    }
    console.log(`🔄 Tri par ${field} ${this.sortDirection}`);
    this.applyFilters();
  }

  resetFilters(): void {
    console.log('🔄 Réinitialisation des filtres');
    this.searchTerm = '';
    this.filterAnnee = 'toutes';
    this.filterType = 'tous';
    this.sortBy = 'dateFerie';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  // =============================================
  // GESTION DU MODAL
  // =============================================

  ouvrirModalAjout(): void {
    console.log('➕ Ouverture modal ajout');
    this.isEditMode = false;
    this.selectedJourFerie = null;
    this.jourFerieForm.reset({
      estChomeEtPaye: true
    });
    this.showModal = true;
  }

  ouvrirModalModification(jourFerie: JourFerieDto): void {
    console.log('✏️ Ouverture modal modification pour:', jourFerie.nom);
    this.isEditMode = true;
    this.selectedJourFerie = jourFerie;
    this.jourFerieForm.patchValue({
      nom: jourFerie.nom,
      dateFerie: jourFerie.dateFerie,
      estChomeEtPaye: jourFerie.estChomeEtPaye
    });
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedJourFerie = null;
    this.jourFerieForm.reset();
  }

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  onSubmit(): void {
    if (this.jourFerieForm.invalid || !this.entrepriseId) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.selectedJourFerie) {
      this.updateJourFerie();
    } else {
      this.createJourFerie();
    }
  }



  private updateJourFerie(): void {
    if (!this.selectedJourFerie) return;

    const formValue = this.jourFerieForm.value;

    // Vérifier si la nouvelle date n'existe pas déjà (sauf pour ce jour férié)
    const dateExists = this.joursFeries.some(jour =>
      jour.dateFerie === formValue.dateFerie && jour.id !== this.selectedJourFerie!.id
    );

    if (dateExists) {
      this.toastrService.error(
        'Un autre jour férié existe déjà pour cette date.',
        'Date déjà utilisée'
      );
      this.isSubmitting = false;
      return;
    }

    const updates = {
      nom: formValue.nom.trim(),
      dateFerie: formValue.dateFerie,
      estChomeEtPaye: formValue.estChomeEtPaye
    };

    console.log('📝 Modification jour férié:', this.selectedJourFerie.id, updates);

    this.configService.updateJourFerie(this.selectedJourFerie.id!, updates)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.toastrService.success(
              `Jour férié "${formValue.nom}" modifié avec succès!`,
              'Succès'
            );
            this.loadJoursFeries();
            this.fermerModal();
          } else {
            this.toastrService.error(
              response.message || 'Erreur lors de la modification',
              'Erreur'
            );
          }
        },
        error: (error) => {
          console.error('❌ Erreur modification:', error);
          const message = error.error?.message || 'Erreur lors de la modification du jour férié';
          this.toastrService.error(message, 'Erreur');
        }
      });
  }

  ouvrirModalSuppression(jourFerie: JourFerieDto): void {
  console.log('🗑️ Ouverture modal suppression pour:', jourFerie.nom);
  this.jourFerieASupprimer = jourFerie;
  this.showDeleteModal = true;
}

fermerModalSuppression(): void {
  this.showDeleteModal = false;
  this.isDeleting = false;
  this.jourFerieASupprimer = null;
}

confirmerSuppression(): void {
  if (!this.jourFerieASupprimer?.id) return;

  this.isDeleting = true;
  console.log('🗑️ Suppression confirmée pour:', this.jourFerieASupprimer.nom);

  this.configService.deleteJourFerie(this.jourFerieASupprimer.id)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isDeleting = false)
    )
    .subscribe({
      next: (response) => {
        if (response.status === 'NO_CONTENT') {
          this.toastrService.success(
            `Jour férié "${this.jourFerieASupprimer!.nom}" supprimé avec succès!`,
            'Succès'
          );
          this.loadJoursFeries();
          this.fermerModalSuppression();
        } else {
          this.toastrService.error('Erreur lors de la suppression', 'Erreur');
        }
      },
      error: (error) => {
        console.error('❌ Erreur suppression:', error);
        const message = error.error?.message || 'Erreur lors de la suppression du jour férié';
        this.toastrService.error(message, 'Erreur');
      }
    });
}

  // =============================================
  // UTILITAIRES
  // =============================================

  getPaginatedItems(): JourFerieDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.joursFeriesFiltres.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getAnneesDisponibles(): string[] {
    const annees = new Set<string>();
    this.joursFeries.forEach(jour => {
      annees.add(new Date(jour.dateFerie).getFullYear().toString());
    });
    return Array.from(annees).sort();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.jourFerieForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.jourFerieForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `Ce champ est obligatoire`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.jourFerieForm.controls).forEach(key => {
      const control = this.jourFerieForm.get(key);
      control?.markAsTouched();
    });
  }

  formatDate(dateString: string): string {
    return this.configService.formatDate(dateString);
  }

  formatDateShort(dateString: string): string {
    return this.configService.formatDateShort(dateString);
  }

  isDateInFuture(dateString: string): boolean {
    return this.configService.isDateInFuture(dateString);
  }



  getDayOfWeek(dateString: string): string {
    return this.configService.getDayOfWeek(dateString);
  }


  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
    this.toastrService.error(message, 'Erreur');
  }

  refresh(): void {
    console.log('🔄 Rafraîchissement des données');
    this.loadJoursFeries();
  }

  // =============================================
  // MÉTHODES TEMPLATE
  // =============================================

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getStatusBadgeClass(estChomeEtPaye: boolean): string {
    return estChomeEtPaye ? 'badge bg-success' : 'badge bg-warning text-dark';
  }

  getStatusText(estChomeEtPaye: boolean): string {
    return estChomeEtPaye ? 'Chômé et payé' : 'Chômé non payé';
  }

  getJoursFeriesParType(type: 'paye' | 'non-paye'): number {
  if (!this.joursFeries) return 0;

  return this.joursFeries.filter(jour => {
    if (type === 'paye') {
      return jour.estChomeEtPaye;
    } else {
      return !jour.estChomeEtPaye;
    }
  }).length;
}

getJoursFeriesRestants(): number {
  if (!this.joursFeries) return 0;

  const currentDate = new Date();
  return this.joursFeries.filter(jour => {
    const jourFerieDate = new Date(jour.dateFerie);
    return jourFerieDate > currentDate;
  }).length;
}

getTotalJoursFeries(): number {
  return this.joursFeries ? this.joursFeries.length : 0;
}








}
