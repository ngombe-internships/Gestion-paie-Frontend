import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import {
  ConfigService,
  TypeCongeConfigDTO,
  TypeCongeConfigResponseDto,
  TypeCongeConfigUpdateRequest
} from '../../../conges/services/config.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-types-conges',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './types-conges.component.html',
  styleUrls: ['./types-conges.component.css']
})
export class TypesCongesComponent implements OnInit, OnDestroy {

  // =============================================
  // RÉFÉRENCES AUX ÉLÉMENTS DOM
  // =============================================
  @ViewChild('modalInitialisation', { static: false }) modalInitialisation!: ElementRef;
  @ViewChild('modalToggleStatus', { static: false }) modalToggleStatus!: ElementRef;

  // =============================================
  // PROPRIÉTÉS DU COMPOSANT
  // =============================================

  // Données
  typeCongeConfigs: TypeCongeConfigDTO[] = [];
  typeCongeConfigsFiltres: TypeCongeConfigDTO[] = [];
  typesCongeDisponibles: any[] = [];

  // États
  isLoading = true;
  isSubmitting = false;
  isInitializing = false;
  isToggling = false;
  error: string | null = null;
  currentUserRole: string | null = null;

  // Filtres et pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchTerm = '';
  filterStatut = 'tous';
  filterType = 'tous';
  sortBy: keyof TypeCongeConfigDTO = 'typeConge';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal d'édition
  showModal = false;
  selectedConfig: TypeCongeConfigDTO | null = null;
  configForm!: FormGroup;

  // Modal de toggle status
  showToggleModal = false;
  configToToggle: TypeCongeConfigDTO | null = null;

  // Statistiques
  statsTotal = 0;
  statsActifs = 0;
  statsInactifs = 0;
  statsNonConfigures = 0;
  typesNonConfiguresLabels = '';

  private destroy$ = new Subject<void>();

  // Services injectés
  private readonly fb = inject(FormBuilder);
  private readonly configService = inject(ConfigService);
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // =============================================
  // CYCLE DE VIE DU COMPOSANT
  // =============================================

  ngOnInit(): void {
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

    if (this.currentUserRole !== 'EMPLOYEUR' && this.currentUserRole !== 'ADMIN') {
      console.error('❌ Accès refusé - Rôles autorisés: EMPLOYEUR, ADMIN');
      this.toastrService.error(
        'Accès non autorisé. Cette fonctionnalité est réservée aux employeurs et administrateurs.',
        'Accès refusé'
      );
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initializeForm();
    this.loadTypesCongeDisponibles();
    this.loadConfigurations();
  }

  // =============================================
  // INITIALISATION
  // =============================================

  private initializeForm(): void {
    this.configForm = this.fb.group({
      dureeMaximaleJours: [null, [
        Validators.required,
        Validators.min(1),
        Validators.max(365)
      ]],
      delaiPreavisJours: [null, [
        Validators.required,
        Validators.min(0),
        Validators.max(90)
      ]],
      pourcentageRemuneration: [null, [
        Validators.required,
        Validators.min(0),
        Validators.max(100)
      ]],
      documentsRequis: [''],
      conditionsAttribution: [''],
      cumulAutorise: [false, [Validators.required]],
      actif: [true, [Validators.required]]
    });
  }

  private loadTypesCongeDisponibles(): void {
    this.typesCongeDisponibles = this.configService.getTypesCongeOptions();
  }

  // =============================================
  // CHARGEMENT DES DONNÉES
  // =============================================

  loadConfigurations(): void {
    this.isLoading = true;
    this.error = null;


    this.configService.getAllConfigs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.typeCongeConfigs = response.data;


            this.calculateStatistics();
            this.applyFilters();

            if (this.typeCongeConfigs.length === 0) {
              this.toastrService.info(
                'Aucune configuration trouvée. Initialisez les configurations par défaut.',
                'Information'
              );
            }
          } else {
            this.handleError('Impossible de charger les configurations.');
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement configurations:', error);
          this.handleError('Erreur lors du chargement des configurations.');
        }
      });
  }

  // =============================================
  // CALCUL DES STATISTIQUES
  // =============================================

  private calculateStatistics(): void {
    this.statsTotal = this.typeCongeConfigs.length;
    this.statsActifs = this.typeCongeConfigs.filter(config => config.actif).length;
    this.statsInactifs = this.statsTotal - this.statsActifs;

    const typesConfigures = this.typeCongeConfigs.map(config => config.typeConge);
    const typesNonConfigures = this.typesCongeDisponibles.filter(
      type => !typesConfigures.includes(type.value)
    );

    this.statsNonConfigures = typesNonConfigures.length;
    this.typesNonConfiguresLabels = typesNonConfigures
      .map(type => type.label)
      .join(', ');


  }

  getTypesNonConfigures(): any[] {
    const typesConfigures = this.typeCongeConfigs.map(config => config.typeConge);
    return this.typesCongeDisponibles.filter(type => !typesConfigures.includes(type.value));
  }

  // =============================================
  // GESTION DES FILTRES
  // =============================================

  applyFilters(): void {
    let filtered = [...this.typeCongeConfigs];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(config =>
        this.configService.getTypeCongeLabel(config.typeConge).toLowerCase().includes(term) ||
        config.conditionsAttribution?.toLowerCase().includes(term) ||
        config.documentsRequis?.toLowerCase().includes(term)
      );
    }

    if (this.filterStatut === 'actifs') {
      filtered = filtered.filter(config => config.actif);
    } else if (this.filterStatut === 'inactifs') {
      filtered = filtered.filter(config => !config.actif);
    }

    if (this.filterType !== 'tous') {
      filtered = filtered.filter(config => config.typeConge === this.filterType);
    }

    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy];
      let valueB: any = b[this.sortBy];

      if (this.sortBy === 'typeConge') {
        valueA = this.configService.getTypeCongeLabel(valueA);
        valueB = this.configService.getTypeCongeLabel(valueB);
      }

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;

      return this.sortDirection === 'desc' ? -result : result;
    });

    this.typeCongeConfigsFiltres = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;

  }

  sort(field: keyof TypeCongeConfigDTO): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    console.log(`🔄 Tri par ${field} ${this.sortDirection}`);
    this.applyFilters();
  }

  resetFilters(): void {
    console.log('🔄 Réinitialisation des filtres');
    this.searchTerm = '';
    this.filterStatut = 'tous';
    this.filterType = 'tous';
    this.sortBy = 'typeConge';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  // =============================================
  // GESTION DES MODAUX
  // =============================================

  // Modal d'initialisation
  ouvrirModalInitialisation(): void {
    console.log('🔄 Ouverture modal initialisation');
    // Pas besoin de logique supplémentaire, Bootstrap s'en charge
  }

  confirmerInitialisation(): void {
    this.isInitializing = true;

    console.log('🔄 Initialisation des configurations par défaut...');

    this.configService.initializeDefaultConfigs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isInitializing = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.toastrService.success(
              'Configurations par défaut initialisées avec succès!',
              'Succès'
            );
            this.loadConfigurations();
            // Fermer le modal
            this.fermerModalBootstrap('modalInitialisation');
          } else {
            this.toastrService.error(
              response.message || 'Erreur lors de l\'initialisation',
              'Erreur'
            );
          }
        },
        error: (error) => {
          console.error('❌ Erreur initialisation:', error);
          const message = error.error?.message || 'Erreur lors de l\'initialisation des configurations';
          this.toastrService.error(message, 'Erreur');
        }
      });
  }

  // Modal de modification
  ouvrirModalModification(config: TypeCongeConfigDTO): void {
    console.log('✏️ Ouverture modal modification pour:', config.typeConge);
    this.selectedConfig = config;
    this.configForm.patchValue({
      dureeMaximaleJours: config.dureeMaximaleJours,
      delaiPreavisJours: config.delaiPreavisJours,
      pourcentageRemuneration: config.pourcentageRemuneration,
      documentsRequis: config.documentsRequis || '',
      conditionsAttribution: config.conditionsAttribution || '',
      cumulAutorise: config.cumulAutorise,
      actif: config.actif
    });
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.selectedConfig = null;
    this.configForm.reset();
  }

  // Modal de toggle status
  ouvrirModalToggleStatus(config: TypeCongeConfigDTO): void {
    console.log('🔄 Ouverture modal toggle pour:', config.typeConge);
    this.configToToggle = config;
    this.showToggleModal = true;
  }

  fermerModalToggleStatus(): void {
    this.showToggleModal = false;
    this.configToToggle = null;
  }

  confirmerToggleStatus(): void {
    if (!this.configToToggle) return;

    const config = this.configToToggle;
    const action = config.actif ? 'désactiver' : 'activer';
    const typeLabel = this.configService.getTypeCongeLabel(config.typeConge);

    this.isToggling = true;

    console.log(`🔄 ${action} configuration:`, config.typeConge);

    this.configService.toggleActiveStatus(config.id!)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isToggling = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.toastrService.success(
              `Configuration "${typeLabel}" ${config.actif ? 'désactivée' : 'activée'} avec succès!`,
              'Succès'
            );
            this.loadConfigurations();
            this.fermerModalToggleStatus();
          } else {
            this.toastrService.error(
              response.message || `Erreur lors de la ${action}`,
              'Erreur'
            );
          }
        },
        error: (error) => {
          console.error(`❌ Erreur ${action}:`, error);
          const message = error.error?.message || `Erreur lors de la ${action} de la configuration`;
          this.toastrService.error(message, 'Erreur');
        }
      });
  }

  // Utilitaire pour fermer les modaux Bootstrap
  private fermerModalBootstrap(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  onSubmit(): void {
    if (this.configForm.invalid || !this.selectedConfig) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.updateConfiguration();
  }

  private updateConfiguration(): void {
    if (!this.selectedConfig) return;

    const formValue = this.configForm.value;
    const updates: TypeCongeConfigUpdateRequest = {
      dureeMaximaleJours: formValue.dureeMaximaleJours,
      delaiPreavisJours: formValue.delaiPreavisJours,
      pourcentageRemuneration: formValue.pourcentageRemuneration,
      documentsRequis: formValue.documentsRequis?.trim() || '',
      conditionsAttribution: formValue.conditionsAttribution?.trim() || '',
      cumulAutorise: formValue.cumulAutorise,
      actif: formValue.actif
    };

    console.log('📝 Modification configuration:', this.selectedConfig.id, updates);

    this.configService.updateConfig(this.selectedConfig.id!, updates)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.toastrService.success(
              `Configuration "${this.configService.getTypeCongeLabel(this.selectedConfig!.typeConge)}" mise à jour avec succès!`,
              'Succès'
            );
            this.loadConfigurations();
            this.fermerModal();
          } else {
            this.toastrService.error(
              response.message || 'Erreur lors de la mise à jour',
              'Erreur'
            );
          }
        },
        error: (error) => {
          console.error('❌ Erreur mise à jour:', error);
          const message = error.error?.message || 'Erreur lors de la mise à jour de la configuration';
          this.toastrService.error(message, 'Erreur');
        }
      });
  }

  // =============================================
  // ACTIVATION/DÉSACTIVATION (SIMPLE)
  // =============================================

  toggleActif(config: TypeCongeConfigDTO): void {
    this.ouvrirModalToggleStatus(config);
  }

  // Méthode pour compatibilité arrière
  initialiserConfigurationsParDefaut(): void {
    this.confirmerInitialisation();
  }

  // =============================================
  // UTILITAIRES
  // =============================================

  getPaginatedItems(): TypeCongeConfigDTO[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.typeCongeConfigsFiltres.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.configForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.configForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `Ce champ est obligatoire`;
      if (field.errors['min']) return `Valeur minimale: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valeur maximale: ${field.errors['max'].max}`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.configForm.controls).forEach(key => {
      const control = this.configForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
    this.toastrService.error(message, 'Erreur');
  }

  refresh(): void {
    console.log('🔄 Rafraîchissement des données');
    this.loadConfigurations();
  }

  // =============================================
  // MÉTHODES TEMPLATE
  // =============================================

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getTypeCongeLabel(type: string): string {
    return this.configService.getTypeCongeLabel(type);
  }

  getStatutBadgeClass(actif: boolean): string {
    return actif ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatutText(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatutIcon(actif: boolean): string {
    return actif ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 100) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  }

  getDocumentsRequisList(documentsRequis: string): string[] {
    if (!documentsRequis) return [];
    return documentsRequis.split(',').map(doc => doc.trim()).filter(doc => doc);
  }

  formatDocumentRequis(doc: string): string {
    const docMap: { [key: string]: string } = {
      'CERTIFICAT_MEDICAL': 'Certificat médical',
      'ACTE_MARIAGE': 'Acte de mariage',
      'CERTIFICAT_CELIBAT': 'Certificat de célibat',
      'ACTE_DECES': 'Acte de décès',
      'LIEN_FAMILLE': 'Justificatif lien familial',
      'CERTIFICAT_GROSSESSE': 'Certificat de grossesse',
      'CERTIFICAT_ACCOUCHEMENT': 'Certificat d\'accouchement',
      'ACTE_NAISSANCE': 'Acte de naissance'
    };
    return docMap[doc] || doc;
  }
}
