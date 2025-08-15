import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../model/ApiResponse';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environment';
import { JourFerieUpdateDto } from '../models/jour-ferie.model';

// =============================================
// INTERFACES
// =============================================

export interface JourFerieDto {
  id?: number;
  dateFerie: string;
  nom: string;
  estChomeEtPaye: boolean;
  entrepriseId?: number;
  entrepriseNom?: string;
}

export interface JourFerieRequestDto {
  nom: string;
  dateFerie: string;
  estChomeEtPaye: boolean;
  entrepriseId: number;
}

export interface TypeCongeConfigDTO {
  id?: number;
  entrepriseId?: number;
  typeConge: string;
  actif: boolean;
  dureeMaximaleJours: number;
  delaiPreavisJours: number;
  pourcentageRemuneration: number;
  documentsRequis: string;
  conditionsAttribution: string;
  cumulAutorise: boolean;
  documentsObligatoires: boolean;
}

export interface TypeCongeConfigResponseDto extends TypeCongeConfigDTO {
  typeCongeLibelle: string;
  entrepriseNom: string;
  dateMiseAJour: string;
}

export interface TypeCongeConfigUpdateRequest {
  dureeMaximaleJours?: number;
  delaiPreavisJours?: number;
  pourcentageRemuneration?: number;
  documentsRequis?: string;
  conditionsAttribution?: string;
  cumulAutorise?: boolean;
  actif?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly joursFeriesUrl = `${environment.apiUrl}/api/jours-feries`;
  private readonly typeCongeConfigUrl = `${environment.apiUrl}/api/type-conge-config`;

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

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
  // GESTION DES JOURS FÉRIÉS
  // =============================================

  getAllJoursFeries(): Observable<ApiResponse<JourFerieDto[]>> {
    return this.http.get<ApiResponse<JourFerieDto[]>>(
      this.joursFeriesUrl,
      this.getHttpOptions()
    );
  }

  /**
   * Récupère un jour férié par ID
   */
  getJourFerieById(id: number): Observable<ApiResponse<JourFerieDto>> {
    return this.http.get<ApiResponse<JourFerieDto>>(
      `${this.joursFeriesUrl}/${id}`,
      this.getHttpOptions()
    );
  }

  /**
   * Récupère un jour férié par date
   */
  getJourFerieByDate(date: string): Observable<JourFerieDto> {
    return this.http.get<JourFerieDto>(
      `${this.joursFeriesUrl}/date/${date}`,
      this.getHttpOptions()
    );
  }

  /**
   * Ajoute un nouveau jour férié
   */
  addJourFerie(jourFerie: JourFerieRequestDto): Observable<ApiResponse<JourFerieDto>> {
    return this.http.post<ApiResponse<JourFerieDto>>(
      this.joursFeriesUrl,
      jourFerie,
      this.getHttpOptions()
    );
  }

  /**
   * Met à jour un jour férié
   */
  updateJourFerie(id: number, jourFerie: Partial<JourFerieDto>): Observable<ApiResponse<JourFerieUpdateDto>> {
    return this.http.put<ApiResponse<JourFerieUpdateDto>>(
      `${this.joursFeriesUrl}/${id}`,
      jourFerie,
      this.getHttpOptions()
    );
  }

  /**
   * Supprime un jour férié
   */
  deleteJourFerie(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.joursFeriesUrl}/${id}`,
      this.getHttpOptions()
    );
  }

  // =============================================
  // GESTION DES TYPES DE CONGÉS
  // =============================================

  /**
   * Récupère toutes les configurations actives
   *
   *
   */

 getAllConfigs(): Observable<ApiResponse<TypeCongeConfigDTO[]>> {
  return this.http.get<ApiResponse<TypeCongeConfigDTO[]>>(
    this.typeCongeConfigUrl,
    this.getHttpOptions()
  );
}

  getActiveConfigs(): Observable<ApiResponse<TypeCongeConfigDTO[]>> {
    return this.http.get<ApiResponse<TypeCongeConfigDTO[]>>(
      this.typeCongeConfigUrl,
      this.getHttpOptions()
    );
  }

  /**
   * Récupère une configuration par type
   */
  getConfigByType(typeConge: string): Observable<ApiResponse<TypeCongeConfigDTO>> {
    return this.http.get<ApiResponse<TypeCongeConfigDTO>>(
      `${this.typeCongeConfigUrl}/type/${typeConge}`,
      this.getHttpOptions()
    );
  }

  /**
   * Initialise les configurations par défaut
   */
  initializeDefaultConfigs(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.typeCongeConfigUrl}/initialize`,
      {},
      this.getHttpOptions()
    );
  }

  /**
   * Met à jour une configuration
   */
  updateConfig(configId: number, updates: TypeCongeConfigUpdateRequest): Observable<ApiResponse<TypeCongeConfigDTO>> {
    return this.http.put<ApiResponse<TypeCongeConfigDTO>>(
      `${this.typeCongeConfigUrl}/${configId}`,
      updates,
      this.getHttpOptions()
    );
  }

  /**
   * Active/Désactive un type de congé
   */
  toggleActiveStatus(configId: number): Observable<ApiResponse<TypeCongeConfigResponseDto>> {
    return this.http.patch<ApiResponse<TypeCongeConfigResponseDto>>(
      `${this.typeCongeConfigUrl}/${configId}/toggle-active`,
      {},
      this.getHttpOptions()
    );
  }

  /**
   * Vérifie si une configuration existe
   */
  configExists(typeConge: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(
      `${this.typeCongeConfigUrl}/exists/${typeConge}`,
      this.getHttpOptions()
    );
  }

  // =============================================
  // UTILITAIRES
  // =============================================

  /**
   * Formate une date pour l'affichage
   */


  /**
   * Types de congés disponibles
   */
  getTypesCongeOptions() {
    return [
      { value: 'CONGE_PAYE', label: 'Congé Payé' },
      { value: 'CONGE_MALADIE', label: 'Congé Maladie' },
      { value: 'CONGE_MATERNITE', label: 'Congé Maternité' },
      { value: 'CONGE_PATERNITE', label: 'Congé Paternité' },
      { value: 'CONGE_SANS_SOLDE', label: 'Congé Sans Solde' },
      { value: 'CONGE_FORMATION', label: 'Congé Formation' },
      { value: 'CONGE_DEUIL', label: 'Congé Deuil' },
      { value: 'CONGE_MARIAGE', label: 'Congé Mariage' },
      { value: 'CONGE_ACCIDENT_TRAVAIL', label: 'Accident de Travail' }
    ];
  }

  /**
   * Obtient le libellé d'un type de congé
   */
  getTypeCongeLabel(type: string): string {
    const option = this.getTypesCongeOptions().find(o => o.value === type);
    return option ? option.label : type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formate une date courte
   */
  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Vérifie si une date est dans le futur
   */
  isDateInFuture(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  /**
   * Vérifie si une date est aujourd'hui
   */
  isDateToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Obtient le jour de la semaine en français
   */
  getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[date.getDay()];
  }

  /**
   * Calcule le nombre de jours jusqu'à une date
   */
  getDaysUntil(dateString: string): number {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }


}
