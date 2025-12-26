import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap, of, forkJoin, catchError } from 'rxjs';
import {
  DemandeCongeCreateDto,
  DemandeCongeResponseDto,
  TypeConge,
  StatutDemandeConge,
  DocumentDto
} from '../models/demande-conge.model';
import { SoldeCongeDto, HistoriqueCongeDto } from '../models/solde-conge.model';
import { ApiResponse } from '../../model/ApiResponse';
import { AuthService } from '../../services/auth.service';
import { EmployeService } from '../../services/employe.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CongeService {
  private readonly apiUrl = `${environment.apiUrl}/api/conge`;
  private readonly soldeApiUrl = `${environment.apiUrl}/api/conge/soldes`;

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly employeService = inject(EmployeService);

  // =============================================
  // CONFIGURATION HTTP
  // =============================================

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // =============================================
  // GESTION DES DEMANDES DE CONGÉS
  // =============================================

  /**
   * Créer une nouvelle demande de congé
   * POST /api/conge
   */
creerDemande(demande: DemandeCongeCreateDto): Observable<ApiResponse<DemandeCongeResponseDto>> {
  if (!demande.employeId) {
    throw new Error('ID employé manquant');
  }

  return this.http.post<ApiResponse<DemandeCongeResponseDto>>(
    this.apiUrl,
    demande,  // ✅ Envoyer directement l'objet JSON
    this.getHttpOptions()
  );
}

creerDemandeAvecFichiers(formData: FormData): Observable<ApiResponse<DemandeCongeResponseDto>> {
  console.log('🆕 Création demande avec fichiers (FormData)');

  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
    // ✅ NE PAS définir Content-Type pour FormData
  });

  return this.http.post<ApiResponse<DemandeCongeResponseDto>>(
    `${this.apiUrl}/with-files`, // ✅ Endpoint spécialisé pour les fichiers
    formData,
    { headers }
  );
}

uploadDocument(formData: FormData) {
  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  // Appel à /api/conge/documents/upload
  return this.http.post<ApiResponse<string>>(
    `${environment.apiUrl}/api/conge/documents/upload`,
    formData,
    { headers }
  );
}




  /**
   * Récupérer MES demandes de congés (employé connecté)
   * Utilise l'ID de l'employé connecté automatiquement
   */
getMesDemandesConges(params: {
    page?: number,
    size?: number,
    statut?: string,
    year?: number,
    searchTerm?: string
}): Observable<any> {
    return this.employeService.getMyEmployeProfile().pipe(
        switchMap(employe => {
            if (!employe || !employe.id) {
                throw new Error('Profil employé non disponible');
            }

            let httpParams = new HttpParams()
                .set('page', params.page?.toString() || '0')
                .set('size', params.size?.toString() || '10');

            if (params.statut && params.statut !== 'TOUS') {
                httpParams = httpParams.set('statut', params.statut);
            }
            if (params.year) {
                httpParams = httpParams.set('year', params.year.toString());
            }
            if (params.searchTerm) {
                httpParams = httpParams.set('searchTerm', params.searchTerm);
            }

            return this.http.get<any>(`${this.apiUrl}/employe/${employe.id}`,
                { params: httpParams });
        })
    );
}
  /**
   * Récupérer les demandes d'un employé spécifique
   * GET /api/conge/employe/{employeId}
   */
  getDemandesEmploye(employeId: number): Observable<ApiResponse<DemandeCongeResponseDto[]>> {
    return this.http.get<ApiResponse<DemandeCongeResponseDto[]>>(
      `${this.apiUrl}/employe/${employeId}`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupérer une demande par son ID
   * GET /api/conge/{id}
   */
  getDemandeById(demandeId: number): Observable<ApiResponse<DemandeCongeResponseDto>> {
    return this.http.get<ApiResponse<DemandeCongeResponseDto>>(
      `${this.apiUrl}/${demandeId}`,
      this.getHttpOptions()
    );
  }

  /**
   * Approuver une demande (EMPLOYEUR uniquement)
   * PUT /api/conge/{id}/approuver
   */
  approuverDemande(demandeId: number): Observable<ApiResponse<DemandeCongeResponseDto>> {
    return this.http.put<ApiResponse<DemandeCongeResponseDto>>(
      `${this.apiUrl}/${demandeId}/approuver`,
      {},
      this.getHttpOptions()
    );
  }

  /**
   * Rejeter une demande (EMPLOYEUR uniquement)
   * PUT /api/conge/{id}/rejeter
   */
  rejeterDemande(demandeId: number, motifRejet: string): Observable<ApiResponse<DemandeCongeResponseDto>> {
    return this.http.put<ApiResponse<DemandeCongeResponseDto>>(
      `${this.apiUrl}/${demandeId}/rejeter`,
      { motifRejet },
      this.getHttpOptions()
    );
  }

  /**
   * Annuler une demande
   * PUT /api/conge/{id}/annuler
   */
  annulerDemande(demandeId: number): Observable<ApiResponse<DemandeCongeResponseDto>> {
  return this.http.put<ApiResponse<DemandeCongeResponseDto>>(
    `${this.apiUrl}/${demandeId}/annuler`,
    {},
    this.getHttpOptions()
  );
}

  /**
   * Récupérer toutes les demandes de l'entreprise (pour employeur)
   * Fait plusieurs appels pour récupérer toutes les demandes
   */
  getToutesDemandesEntreprise(employeIds: number[]): Observable<DemandeCongeResponseDto[]> {
    if (!employeIds || employeIds.length === 0) {
      return of([]);
    }

    const requests = employeIds.map(employeId =>
      this.getDemandesEmploye(employeId).pipe(
        map(response => response.data ?? []),
        catchError(error => {
          console.warn(`Pas de demandes pour employé ${employeId}:`, error);
          return of([]);
        })
      )
    );

    return forkJoin(requests).pipe(
      map(results => results.flat().sort((a, b) => {
        // Tri décroissant par date de demande
        return new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime();
      }))
    );
  }


   // Récupérer les documents d'une demande
  getDocumentsDemande(demandeId: number): Observable<ApiResponse<DocumentDto[]>> {
    return this.http.get<ApiResponse<DocumentDto[]>>(
      `${this.apiUrl}/documents/${demandeId}`,
      this.getHttpOptions()
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


  /**
 * Récupérer toutes les demandes de l'entreprise pour employeur
 * Utilise les endpoints existants avec pagination
 */
getToutesDemandesEntrepriseEmployeur(): Observable<DemandeCongeResponseDto[]> {

  return this.getTousSoldesEntreprise().pipe(
    switchMap(soldesResponse => {

      if (soldesResponse.status === 'OK' && soldesResponse.data) {
        const employeIds = soldesResponse.data.map((s: any) => s.employeId);

        if (employeIds.length === 0) {
          return of([]);
        }

        // ✅ Faire des appels pour chaque employé avec pagination
        const requests = employeIds.map(employeId =>
          this.http.get<any>(`${this.apiUrl}/employe/${employeId}`, {
            params: new HttpParams()
              .set('page', '0')
              .set('size', '1000'), // Grande taille pour récupérer toutes les demandes
            ...this.getHttpOptions()
          }).pipe(
            map(response => {

              // ✅ Gérer la structure PageResponse
              if (response && response.content) {
                return response.content;
              }
              return [];
            }),
            catchError(error => {
              console.warn(`⚠️ Service: Pas de demandes pour employé ${employeId}:`, error);
              return of([]); // Retourner un tableau vide en cas d'erreur
            })
          )
        );

        return forkJoin(requests).pipe(
          map(results => {
            const allDemandes = results.flat();

            // ✅ Trier par date de demande (plus récent en premier)
            const sortedDemandes = allDemandes.sort((a, b) =>
              new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime()
            );

            return sortedDemandes;
          }),
          catchError(error => {
            console.error('❌ Service: Erreur lors du traitement des demandes:', error);
            return of([]); // Retourner un tableau vide en cas d'erreur globale
          })
        );
      }

      return of([]);
    }),
    catchError(error => {
      return of([]); // Retourner un tableau vide en cas d'erreur
    })
  );
}


  // =============================================
  // GESTION DES SOLDES DE CONGÉS
  // =============================================

  /**
   * Récupérer MON solde de congés (employé connecté)
   * GET /api/conge/soldes/me
   */
  getMonSolde(): Observable<ApiResponse<SoldeCongeDto>> {
    return this.http.get<ApiResponse<SoldeCongeDto>>(
      `${this.soldeApiUrl}/me`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupérer le solde d'un employé spécifique (EMPLOYEUR uniquement)
   * GET /api/conge/soldes/employe/{employeId}
   */
  getSoldeEmploye(employeId: number): Observable<ApiResponse<SoldeCongeDto>> {
    return this.http.get<ApiResponse<SoldeCongeDto>>(
      `${this.soldeApiUrl}/employe/${employeId}`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupérer tous les soldes de l'entreprise (EMPLOYEUR uniquement)
   * GET /api/conge/soldes/entreprise
   */
  getTousSoldesEntreprise(): Observable<ApiResponse<SoldeCongeDto[]>> {
    return this.http.get<ApiResponse<SoldeCongeDto[]>>(
      `${this.soldeApiUrl}/entreprise`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupérer l'historique des congés d'un employé
   * GET /api/conge/soldes/historique/employe/{employeId}
   */
  getHistoriqueConges(employeId: number): Observable<ApiResponse<HistoriqueCongeDto[]>> {
    return this.http.get<ApiResponse<HistoriqueCongeDto[]>>(
      `${this.soldeApiUrl}/historique/employe/${employeId}`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupérer MON historique de congés (employé connecté)
   */
  getMonHistorique(): Observable<ApiResponse<HistoriqueCongeDto[]>> {

    return this.employeService.getMyEmployeProfile().pipe(
      switchMap(employe => {
        if (!employe || !employe.id) {
          throw new Error('Informations employé non disponibles.');
        }
        return this.getHistoriqueConges(employe.id);
      })
    );
  }

  // =============================================
  // UTILITAIRES POUR LES TYPES DE CONGÉS
  // =============================================

getTypesCongeOptions() {
  return [
    { value: TypeConge.CONGE_PAYE, label: 'Congé payé annuel' },
    { value: TypeConge.CONGE_MALADIE, label: 'Congé maladie' },
    { value: TypeConge.CONGE_MATERNITE, label: 'Congé maternité' },
    { value: TypeConge.CONGE_PATERNITE, label: 'Congé paternité' },
    { value: TypeConge.CONGE_SANS_SOLDE, label: 'Congé sans solde' },
    { value: TypeConge.CONGE_FORMATION, label: 'Congé formation' },
    { value: TypeConge.CONGE_DEUIL, label: 'Congé deuil' },
  ];
}

  getTypeCongeLabel(type: TypeConge): string {
    const option = this.getTypesCongeOptions().find(o => o.value === type);
    return option ? option.label : String(type);
  }

  typeCongeNeedsSolde(type: TypeConge): boolean {
  return type === TypeConge.CONGE_PAYE;
 }


  // =============================================
  // UTILITAIRES POUR LES STATUTS
  // =============================================

  getStatutLabel(statut: StatutDemandeConge): string {
    switch (statut) {
      case StatutDemandeConge.EN_ATTENTE: return 'En attente';
      case StatutDemandeConge.APPROUVEE: return 'Approuvée';
      case StatutDemandeConge.REJETEE: return 'Rejetée';
      case StatutDemandeConge.ANNULEE: return 'Annulée';
      default: return statut;
    }
  }

  getStatutClass(statut: StatutDemandeConge): string {
    switch (statut) {
      case StatutDemandeConge.APPROUVEE: return 'badge bg-success';
      case StatutDemandeConge.EN_ATTENTE: return 'badge bg-warning text-dark';
      case StatutDemandeConge.REJETEE: return 'badge bg-danger';
      case StatutDemandeConge.ANNULEE: return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  getStatutIcon(statut: StatutDemandeConge): string {
    switch (statut) {
      case StatutDemandeConge.APPROUVEE: return 'bi-check-circle';
      case StatutDemandeConge.EN_ATTENTE: return 'bi-clock-history';
      case StatutDemandeConge.REJETEE: return 'bi-x-circle';
      case StatutDemandeConge.ANNULEE: return 'bi-slash-circle';
      default: return 'bi-question-circle';
    }
  }

  getStatutColor(statut: StatutDemandeConge): string {
    switch (statut) {
      case StatutDemandeConge.APPROUVEE: return 'success';
      case StatutDemandeConge.EN_ATTENTE: return 'warning';
      case StatutDemandeConge.REJETEE: return 'danger';
      case StatutDemandeConge.ANNULEE: return 'secondary';
      default: return 'secondary';
    }
  }

  // =============================================
  // CALCULS ET VALIDATIONS
  // =============================================

  /**
   * Calcul du nombre de jours ouvrables entre deux dates (hors week-ends)
   * Note: Ne prend pas en compte les jours fériés côté frontend
   */
  calculerJoursOuvrables(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    let jours = 0;

    if (debut > fin) return 0;

    for (let date = new Date(debut); date <= fin; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Exclure samedi (6) et dimanche (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        jours++;
      }
    }

    return jours;
  }

  /**
   * Vérifier la validité des dates de congé
   */
  verifierValiditeDates(dateDebut: string, dateFin: string): { valide: boolean, message?: string } {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    if (debut < aujourd_hui) {
      return { valide: false, message: 'La date de début ne peut pas être dans le passé' };
    }

    if (debut > fin) {
      return { valide: false, message: 'La date de début doit être antérieure à la date de fin' };
    }

    return { valide: true };
  }

  // =============================================
  // UTILITAIRES D'AFFICHAGE
  // =============================================

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDureeLabel(nbJours: number): string {
    return `${nbJours} jour${nbJours > 1 ? 's' : ''}`;
  }

  // =============================================
  // PRIORITÉS ET URGENCES
  // =============================================

  getPrioriteDemandeClass(demande: DemandeCongeResponseDto): string {
    if (demande.statut !== StatutDemandeConge.EN_ATTENTE) {
      return '';
    }

    const dateDebut = new Date(demande.dateDebut);
    const maintenant = new Date();
    const joursRestants = Math.ceil((dateDebut.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) return 'table-danger'; // Déjà commencé
    if (joursRestants <= 3) return 'table-warning'; // Urgent
    if (joursRestants <= 7) return 'table-info'; // Important
    return '';
  }

  getPrioriteTexte(demande: DemandeCongeResponseDto): string {
    if (demande.statut !== StatutDemandeConge.EN_ATTENTE) {
      return '';
    }

    const dateDebut = new Date(demande.dateDebut);
    const maintenant = new Date();
    const joursRestants = Math.ceil((dateDebut.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) return 'Congé déjà commencé !';
    if (joursRestants === 0) return 'Commence aujourd\'hui !';
    if (joursRestants === 1) return 'Commence demain !';
    if (joursRestants <= 3) return `Commence dans ${joursRestants} jours`;
    if (joursRestants <= 7) return `Commence dans ${joursRestants} jours`;
    return '';
  }

  // =============================================
  // PERMISSIONS ET RÔLES
  // =============================================

  peutCreerDemande(): boolean {
    return this.authService.hasRole('EMPLOYE') || this.authService.hasRole('EMPLOYEUR');
  }

  peutVoirDemandesEmploye(): boolean {
    return this.authService.hasRole('EMPLOYEUR') || this.authService.hasRole('ADMIN');
  }

  peutApprouverRejeter(): boolean {
    return this.authService.hasRole('EMPLOYEUR');
  }

  peutAnnulerDemande(demande: DemandeCongeResponseDto): boolean {
    return demande.statut === StatutDemandeConge.EN_ATTENTE;
  }

  // =============================================
  // SOLDES - UTILITAIRES
  // =============================================

  calculerAnciennete(dateEmbauche: string): number {
    const aujourd_hui = new Date();
    const embauche = new Date(dateEmbauche);
    const diffMs = aujourd_hui.getTime() - embauche.getTime();
    const diffAnnees = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffAnnees);
  }

  getCouleurBadgeSolde(soldeDisponible: number, soldeTotal: number): string {
    if (soldeTotal === 0) return 'secondary';

    const pourcentage = (soldeDisponible / soldeTotal) * 100;

    if (pourcentage >= 70) return 'success';
    if (pourcentage >= 30) return 'warning';
    return 'danger';
  }

  getPourcentageSolde(soldeDisponible: number, soldeTotal: number): number {
    if (soldeTotal === 0) return 0;
    return Math.round((soldeDisponible / soldeTotal) * 100);
  }


}
