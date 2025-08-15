import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DemandeCongeResponseDto, DocumentDto, StatutDemandeConge, TypeConge } from '../../models/demande-conge.model';
import { AuthService } from '../../../services/auth.service';
import { CongeService } from '../../services/conge.service';
import { DocumentViewerService } from '../../../shared/services/document-viewer.service';

@Component({
  selector: 'app-conges-demandes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './conges-demandes.component.html',
  styleUrls: ['./conges-demandes.component.css']
})
export class CongesDemandesComponent implements OnInit, OnDestroy {

  // État des données
  demandes: DemandeCongeResponseDto[] = [];
  demandesFiltrees: DemandeCongeResponseDto[] = [];
  isLoading = true;
  error: string | null = null;
  lastUpdate: Date = new Date();
  documents: DocumentDto[] = [];
  isLoadingDocuments = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filtres
  searchTerm = '';
  filterStatut = 'tous';
  filterType = 'tous';
  sortBy = 'dateDemande';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Modal de rejet
  showRejectModal = false;
  selectedDemande: DemandeCongeResponseDto | null = null;
  motifRejet = '';
  isProcessing = false;

  // Modal de détails et approuver
  showDetailsModal = false;
  showApprovalModal = false;

  selectedDemandeForApproval: DemandeCongeResponseDto | null = null;

  // Gestion des notifications (simple)
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' = 'success';

  private destroy$ = new Subject<void>();

  // Injection des services
  public readonly authService = inject(AuthService);
  public readonly congeService = inject(CongeService);
  public readonly soldeService = inject(CongeService);
  private readonly documentViewerService = inject(DocumentViewerService);


  // Énums pour le template
  StatutDemandeConge = StatutDemandeConge;
  TypeConge = TypeConge;

  constructor() {}

  ngOnInit(): void {
    // Vérifier les permissions
    if (this.authService.hasRole('EMPLOYEUR') || this.authService.isAdmin()) {
      this.loadDemandes();
    } else {
      this.error = 'Accès non autorisé. Vous devez être employeur pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les demandes de congés de l'entreprise
   */
loadDemandes(): void {
  this.isLoading = true;
  this.error = null;
  this.lastUpdate = new Date();


  // ✅ SOLUTION SIMPLE : Appel direct au service
  this.congeService.getToutesDemandesEntrepriseEmployeur()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (demandes) => {

        this.demandes = demandes;
        this.applyFilters();
        this.isLoading = false;

        if (demandes.length === 0) {
          this.showNotificationMessage('Aucune demande de congé trouvée', 'warning');
        } else {
          this.showNotificationMessage(`${demandes.length} demande(s) chargée(s) avec succès`, 'success');
        }

      },
      error: (error) => {
        console.error('❌ Composant: Erreur lors du chargement des demandes:', error);
        this.error = 'Erreur lors du chargement des demandes.';
        this.isLoading = false;
        this.showNotificationMessage('Erreur lors du chargement des demandes', 'error');
      }
    });
}


//Finalise le chargement des demandes

private finalizeLoadDemandes(allDemandes: DemandeCongeResponseDto[], hasError: boolean): void {
  // Trier par date de demande (plus récent en premier)
  allDemandes.sort((a, b) => {
    return new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime();
  });

  this.demandes = allDemandes;
  this.applyFilters();
  this.isLoading = false;


  if (allDemandes.length === 0) {
    this.showNotificationMessage('Aucune demande de congé trouvée', 'warning');
  } else {
    const message = hasError
      ? `${allDemandes.length} demande(s) chargée(s) (certains employés n'ont pas de demandes)`
      : `${allDemandes.length} demande(s) chargée(s) avec succès`;

    this.showNotificationMessage(message, hasError ? 'warning' : 'success');
  }
}

  /**
   * Applique les filtres et la recherche sur les demandes
   */
  applyFilters(): void {
    let filtered = [...this.demandes];

    // Filtre par recherche (nom employé, raison, etc.)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(demande =>
        demande.employeNom.toLowerCase().includes(term) ||
        demande.employePrenom.toLowerCase().includes(term) ||
        (demande.raison && demande.raison.toLowerCase().includes(term)) ||
        demande.employeId.toString().includes(term)
      );
    }

    // Filtre par statut
    if (this.filterStatut !== 'tous') {
      filtered = filtered.filter(demande => demande.statut === this.filterStatut);
    }

    // Filtre par type de congé
    if (this.filterType !== 'tous') {
      filtered = filtered.filter(demande => demande.typeConge === this.filterType);
    }

    // Tri des résultats
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof DemandeCongeResponseDto];
      let valueB: any = b[this.sortBy as keyof DemandeCongeResponseDto];

      // Gestion spéciale pour les dates
      if (this.sortBy.includes('date') || this.sortBy.includes('Date')) {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      // Gestion des chaînes de caractères
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;

      return this.sortDirection === 'desc' ? -result : result;
    });

    this.demandesFiltrees = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset à la première page après filtrage

  }

  /**
   * Change le tri des colonnes
   */
  sort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc'; // Par défaut, tri descendant
    }
    this.applyFilters();
  }

  /**
   * Obtient les éléments de la page courante
   */
  getPaginatedItems(): DemandeCongeResponseDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.demandesFiltrees.slice(start, end);
  }

  /**
   * Calcule le nombre total de pages
   */
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Navigue vers une page spécifique
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      console.log(`📄 Navigation vers la page ${page}`);
    }
  }

  // ==============================================
  // ACTIONS SUR LES DEMANDES
  // ==============================================

  /**
   * Approuve une demande de congé
   */
 approuverDemande(demande: DemandeCongeResponseDto): void {
  if (this.isProcessing || !this.canApproveDemande(demande)) {
    console.warn('❌ Impossible d\'approuver cette demande');
    return;
  }

  console.log(`✅ Ouverture modal approbation pour demande ${demande.id}`);
  this.selectedDemandeForApproval = demande;
  this.showApprovalModal = true;
}

confirmerApprobation(): void {
  if (!this.selectedDemandeForApproval || this.isProcessing) {
    return;
  }

  const demande = this.selectedDemandeForApproval;
  console.log(`✅ Confirmation approbation demande ${demande.id}...`);
  this.isProcessing = true;

  this.congeService.approuverDemande(demande.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('✅ Réponse approbation:', response);

        if (response.status === 'OK' && response.data) {
          // ✅ Mettre à jour la demande dans la liste
          const index = this.demandes.findIndex(d => d.id === demande.id);
          if (index !== -1) {
            this.demandes[index] = response.data;
            this.applyFilters();
          }

          this.showNotificationMessage(
            `Demande de ${demande.employePrenom} ${demande.employeNom} approuvée avec succès`,
            'success'
          );

          // Fermer le modal
          this.fermerModalApprobation();
        } else {
          this.showNotificationMessage(
            response.message || 'Erreur lors de l\'approbation',
            'error'
          );
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'approbation:', error);

        let messageErreur = 'Erreur lors de l\'approbation de la demande';
        if (error.error?.message) {
          messageErreur = error.error.message;
        }

        this.showNotificationMessage(messageErreur, 'error');
        this.isProcessing = false;
      }
    });
}


getTypeCongeNeedsSolde(typeConge: TypeConge): boolean {
  return this.congeService.typeCongeNeedsSolde(typeConge);
}

/**
 *  Ferme le modal d'approbation
 */
fermerModalApprobation(): void {
  this.showApprovalModal = false;
  this.selectedDemandeForApproval = null;
}
  /**
   * Ouvre le modal de rejet
   */
  ouvrirModalRejet(demande: DemandeCongeResponseDto): void {
    console.log(`❌ Ouverture modal rejet pour demande ${demande.id}`);
    this.selectedDemande = demande;
    this.motifRejet = '';
    this.showRejectModal = true;
  }

  /**
   * Rejette une demande avec motif
   */
  rejeterDemande(): void {
    if (!this.selectedDemande || !this.motifRejet.trim() || this.isProcessing) {
      return;
    }

    console.log(`❌ Rejet de la demande ${this.selectedDemande.id} avec motif: ${this.motifRejet}`);
    this.isProcessing = true;

    this.congeService.rejeterDemande(this.selectedDemande.id, this.motifRejet.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            const index = this.demandes.findIndex(d => d.id === this.selectedDemande!.id);
            if (index !== -1) {
              this.demandes[index] = response.data;
              this.applyFilters();
            }

            this.showNotificationMessage(
              `Demande de ${this.selectedDemande!.employePrenom} ${this.selectedDemande!.employeNom} rejetée`,
              'success'
            );
            console.log(`❌ Demande ${this.selectedDemande!.id} rejetée`);
            this.fermerModalRejet();
          } else {
            this.showNotificationMessage('Erreur lors du rejet', 'error');
          }
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du rejet:', error);
          this.showNotificationMessage('Erreur lors du rejet de la demande', 'error');
          this.isProcessing = false;
        }
      });
  }

  /**
   * Ferme le modal de rejet
   */
  fermerModalRejet(): void {
    this.showRejectModal = false;
    this.selectedDemande = null;
    this.motifRejet = '';
  }

  /**
   * Annule une demande de congé
   */
  annulerDemande(demande: DemandeCongeResponseDto): void {
    if (this.isProcessing) return;

    const confirmation = confirm(
      `Êtes-vous sûr de vouloir annuler la demande de ${demande.employePrenom} ${demande.employeNom} ?`
    );

    if (confirmation) {
      console.log(`🗑️ Annulation de la demande ${demande.id}...`);
      this.isProcessing = true;

      this.congeService.annulerDemande(demande.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.status === 'OK' && response.data) {
              const index = this.demandes.findIndex(d => d.id === demande.id);
              if (index !== -1) {
                this.demandes[index] = response.data;
                this.applyFilters();
              }

              this.showNotificationMessage(
                `Demande de ${demande.employePrenom} ${demande.employeNom} annulée`,
                'success'
              );
              console.log(`🗑️ Demande ${demande.id} annulée`);
            } else {
              this.showNotificationMessage('Erreur lors de l\'annulation', 'error');
            }
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('❌ Erreur lors de l\'annulation:', error);
            this.showNotificationMessage('Erreur lors de l\'annulation de la demande', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  /**
   * Affiche les détails d'une demande
   */
voirDetails(demande: DemandeCongeResponseDto): void {
  console.log(`👁️ Affichage détails demande ${demande.id}`);
  this.selectedDemande = demande;
  this.showDetailsModal = true;
  this.loadDocuments(demande.id);
}

loadDocuments(demandeId: number): void {
  this.isLoadingDocuments = true;
  this.documents = [];

  this.congeService.getDocumentsDemande(demandeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.documents = response.data ?? [];
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des documents:', error);
        this.showNotificationMessage('Erreur lors du chargement des documents', 'error');
      },
      complete: () => {
        this.isLoadingDocuments = false;
      }
    });
}
  /**
   * Ferme le modal de détails
   */
  fermerModalDetails(): void {
  this.showDetailsModal = false;
  this.selectedDemande = null;
  this.documents = [];
  this.isLoadingDocuments = false;
}

  // ==============================================
  // MÉTHODES UTILITAIRES
  // ==============================================

  /**
   * Formate une date
   */
  formatDate(dateString: string): string {
    return this.congeService.formatDate(dateString);
  }

  /**
   * Formate une date courte
   */
  formatDateShort(dateString: string): string {
    return this.congeService.formatDateShort(dateString);
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getStatutClass(statut: StatutDemandeConge): string {
    return this.congeService.getStatutClass(statut);
  }

  /**
   * Obtient le libellé du statut
   */
  getStatutLabel(statut: StatutDemandeConge): string {
    return this.congeService.getStatutLabel(statut);
  }

  /**
   * Obtient l'icône du statut
   */
  getStatutIcon(statut: StatutDemandeConge): string {
    return this.congeService.getStatutIcon(statut);
  }

  /**
   * Obtient le libellé du type de congé
   */
  getTypeLabel(type: TypeConge): string {
    return this.congeService.getTypeCongeLabel(type);
  }


  /**
   * Calcule la durée en jours ouvrables
   */
  calculerDuree(dateDebut: string, dateFin: string): number {
    return this.congeService.calculerJoursOuvrables(dateDebut, dateFin);
  }

  /**
   * Obtient la classe de priorité pour une demande
   */
  getPriorityClass(demande: DemandeCongeResponseDto): string {
    return this.congeService.getPrioriteDemandeClass(demande);
  }

  /**
   * Obtient le texte de priorité pour une demande
   */
  getPriorityText(demande: DemandeCongeResponseDto): string {
    return this.congeService.getPrioriteTexte(demande);
  }

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    console.log('🔄 Rafraîchissement des données...');
    this.loadDemandes();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    console.log('🔄 Réinitialisation des filtres...');
    this.searchTerm = '';
    this.filterStatut = 'tous';
    this.filterType = 'tous';
    this.sortBy = 'dateDemande';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  // ==============================================
  // STATISTIQUES
  // ==============================================

  /**
   * Obtient le nombre de demandes par statut
   */
  getDemandesParStatut(statut: string): number {
    return this.demandes.filter(d => d.statut === statut).length;
  }

  /**
   * Obtient le nombre de demandes urgentes (< 7 jours)
   */
  getDemandesUrgentes(): number {
    const maintenant = new Date();
    return this.demandes.filter(d => {
      if (d.statut !== StatutDemandeConge.EN_ATTENTE) return false;

      const dateDebut = new Date(d.dateDebut);
      const joursRestants = Math.ceil((dateDebut.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));
      return joursRestants <= 7 && joursRestants >= 0;
    }).length;
  }

  /**
   * Obtient le pourcentage d'approbation
   */
  getPourcentageApprobation(): number {
    const totalTraitees = this.demandes.filter(d =>
      d.statut === StatutDemandeConge.APPROUVEE || d.statut === StatutDemandeConge.REJETEE
    ).length;

    if (totalTraitees === 0) return 0;

    const approuvees = this.getDemandesParStatut('APPROUVEE');
    return Math.round((approuvees / totalTraitees) * 100);
  }

  // ==============================================
  // GESTION DES NOTIFICATIONS
  // ==============================================

  /**
   * Affiche un message de notification
   */
  private showNotificationMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Masquer automatiquement après 3 secondes
    setTimeout(() => {
      this.hideNotification();
    }, 3000);
  }

  /**
   * Masque la notification
   */
  hideNotification(): void {
    this.showNotification = false;
  }

  // ==============================================
  // MÉTHODES UTILITAIRES SUPPLÉMENTAIRES
  // ==============================================

  /**
   * Obtient le minimum entre deux nombres
   */
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  /**
   * Vérifie si une demande peut être modifiée
   */
  canModifyDemande(demande: DemandeCongeResponseDto): boolean {
    return demande.statut === StatutDemandeConge.EN_ATTENTE ||
           demande.statut === StatutDemandeConge.APPROUVEE;
  }

  /**
   * Vérifie si une demande peut être approuvée
   */
 canApproveDemande(demande: DemandeCongeResponseDto): boolean {
  return demande.statut === StatutDemandeConge.EN_ATTENTE &&
         this.authService.hasRole('EMPLOYEUR');
}

  /**
   * Vérifie si une demande peut être rejetée
   */
  canRejectDemande(demande: DemandeCongeResponseDto): boolean {
    return demande.statut === StatutDemandeConge.EN_ATTENTE;
  }

  /**
   * Obtient la liste des pages pour la pagination
   */
  get pages(): number[] {
    return Array(this.getTotalPages()).fill(0).map((x, i) => i + 1);
  }

  /**
   * Obtient les options de types de congé pour le filtre
   */
  getTypeCongeOptions() {
    return this.congeService.getTypesCongeOptions();
  }

  /**
   * Vérifie si l'utilisateur a le rôle spécifié
   */
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  /**
   * Obtient le nom d'utilisateur actuel
   */
  getCurrentUsername(): string | null {
    return this.authService.getUsername();
  }

  /**
   * Vérifie si le composant est en mode chargement
   */
  get isLoadingData(): boolean {
    return this.isLoading || this.isProcessing;
  }

  /**
   * Obtient le nombre total de demandes
   */
  get totalDemandes(): number {
    return this.demandes.length;
  }

  /**
   * Vérifie s'il y a des demandes à traiter
   */
  get hasDemandesEnAttente(): boolean {
    return this.demandes.some(d => d.statut === StatutDemandeConge.EN_ATTENTE);
  }


  getDocumentIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'bi-file-pdf text-danger';
    case 'jpg':
    case 'jpeg':
    case 'png': return 'bi-file-image text-primary';
    default: return 'bi-file-earmark';
  }
}
formatFileSize(bytes: number): string {
  return this.congeService.formatFileSize(bytes);
}


openDocument(url: string, nom: string = '', taille: number = 0): void {
  if (url) {
    // ✅ NOUVELLE APPROCHE : Utiliser le modal hybride
    this.documentViewerService.openDocument({
      url: url,
      nom: nom || 'Document',
      type: this.getDocumentType(nom),
      taille: taille
    });
  } else {
    this.showNotificationMessage('URL du document non disponible', 'error');
  }
}
private getDocumentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
 }

}
