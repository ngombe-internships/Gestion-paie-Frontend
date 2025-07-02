import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BulletinPaie } from '../model/bulletin';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment';
import { Employe } from '../model/employe';
import { DashboardMetric } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {
  private readonly baseUrl = environment.apiUrl +'/api/bulletins';
  private readonly http = inject(HttpClient);

  constructor() { }

  // Méthode pour calculer le bulletin
  calculerBulletin(fiche: BulletinPaie): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.post<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/calculate1`, fiche);
  }

  // Méthode pour créer un bulletin
  creerBulletin(fiche: BulletinPaie): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.post<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/create`, fiche);
  }

  // Méthode pour récupérer tous les bulletins
  getAllBulletins(): Observable<BulletinPaie[]> {
    return this.http.get<ApiResponse<BulletinPaie[]>>(this.baseUrl).pipe(
      map(response => response.data)
    );
  }

  // Méthode pour récupérer un bulletin par ID
  getBulletinById(id: number): Observable<BulletinPaie> {
    return this.http.get<ApiResponse<BulletinPaie>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Méthode pour mettre à jour un bulletin
  updateBulletin(id: number, fiche: BulletinPaie): Observable<BulletinPaie> {
    return this.http.put<ApiResponse<BulletinPaie>>(`${this.baseUrl}/${id}`, fiche).pipe(
      map(response => response.data)
    );
  }

  // Méthode pour supprimer un bulletin
  deleteBulletin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  //methode pour employeur
  getBulletinsForEmployeur(searchTerm: string= ''): Observable<ApiResponse<BulletinPaieEmployeurDto[]>> {
    let url = `${this.baseUrl}/employeur`;
      if (searchTerm) {
          url += `?searchTerm=${encodeURIComponent(searchTerm)}`;
      }
      return this.http.get<ApiResponse<BulletinPaieEmployeurDto[]>>(url);
  }

  //methode pour employe
  getMyBulletins(): Observable<BulletinPaieResponseDto[]> {
    return this.http.get<ApiResponse<BulletinPaieResponseDto[]>>(`${this.baseUrl}/my-bulletins`).pipe(
      map(response => response.data)
    );

  }


   validerBulletin(id: number): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.patch<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/${id}/validate`, {});
  }

  envoyerBulletin(id: number): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.patch<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/${id}/send`, {});
  }

  archiverBulletin(id: number): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.patch<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/${id}/archive`, {});
  }

  annulerBulletin(id: number): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.patch<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Méthode pour télécharger le PDF
  downloadBulletinPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf/${id}`, { responseType: 'blob' });
  }

  getBulletinPreviewHtml(id: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${id}/previews`, {responseType: 'text'});
  }

  getBulletinCountForEmployer(): Observable<ApiResponse<number>>{
      return this.http.get<ApiResponse<number>>(`${this.baseUrl}/count`)
    }

}


interface ApiResponse<T> {
  message: string;
  data: T;
  statut: HttpStatusCode;
}

// Interface pour la réponse du bulletin calculé
export interface BulletinPaieResponseDto {
  id?: number;
  employe?: Employe;
  salaireBase?: number;
  heuresNormal?: number;
  tauxHoraire?:number;
  heuresSup1?: number;
  heuresSup2?: number;
  heuresNuit?: number;
  heuresFerie?: number;
  primeTransport? : number,
  primePonctualite? : number,
  primeTechnicite ?: number,
  primeAnciennete ?: number,
  primeRendement ?: number,
  totalPrimes?: number;
  salaireBrut?: number;
  salaireImposable?: number;
  baseCnps?: number;
  baseCnps1?: number; //pour les calcul lier
  // Impôts et taxes
  irpp?: number;
  cac?: number;
  taxeCommunale?: number;
  redevanceAudioVisuelle?: number;

  // Cotisations salariales
  cnpsVieillesseSalarie?: number;
  creditFoncierSalarie?: number;
  fneSalarie?: number;
  totalRetenues?: number;

  // Charges patronales
  cnpsVieillesseEmployeur?: number;
  cnpsAllocationsFamiliales?: number;
  cnpsAccidentsTravail?: number;
  creditFoncierPatronal?: number;
  fnePatronal?: number;
  totalChargesPatronales?: number;

  // Résultats finaux
  salaireNet?: number;
  coutTotalEmployeur?: number;
  cotisationCnps?: number;

  //conge
  allocationConge?: number;
  jourConge?:number;
  //nouveau statut

  statusBulletin?: 'GÉNÉRÉ' | 'VALIDÉ' | 'ENVOYÉ' | 'ARCHIVÉ' | 'ANNULÉ';
  periodePaie?: string;
  dateCreationBulletin?: string;
  datePaiement?: string;
  methodePaiement?: string
  avancesSurSalaires?:number

}

export interface BulletinPaieEmployeurDto   {
  employe?: EmployeResponseDto;
  id?: number;
  salaireBase?: number;
  heuresNormal?: number;
  tauxHoraire?:number;
  heuresSup1?: number;
  heuresSup2?: number;
  heuresNuit?: number;
  heuresFerie?: number;
  primeTransport? : number,
  primePonctualite? : number,
  primeTechnicite ?: number,
  primeAnciennete ?: number,
  primeRendement ?: number,
  totalPrimes?: number;
  salaireBrut?: number;
  salaireImposable?: number;
  baseCnps?: number;
  baseCnps1?: number; //pour les calcul lier
  // Impôts et taxes
  irpp?: number;
  cac?: number;
  taxeCommunale?: number;
  redevanceAudioVisuelle?: number;

  // Cotisations salariales
  cnpsVieillesseSalarie?: number;
  creditFoncierSalarie?: number;
  fneSalarie?: number;
  totalRetenues?: number;

  // Charges patronales
  cnpsVieillesseEmployeur?: number;
  cnpsAllocationsFamiliales?: number;
  cnpsAccidentsTravail?: number;
  creditFoncierPatronal?: number;
  fnePatronal?: number;
  totalChargesPatronales?: number;

  // Résultats finaux
  salaireNet?: number;
  coutTotalEmployeur?: number;
  cotisationCnps?: number;

  //conge
  allocationConge?: number;
  jourConge?:number;

  //nouveau
  statusBulletin?: 'GÉNÉRÉ' | 'VALIDÉ' | 'ENVOYÉ' | 'ARCHIVÉ' | 'ANNULÉ';
  periodePaie?: string;
  dateCreationBulletin?: string;
  datePaiement?: string;
  methodePaiement?: string;
  avancesSurSalaires?:number;

}

export interface EmployeResponseDto {
  id?: number;
  matricule?: string;
  nom?: string;
  prenom?: string;
  numeroCnps?: string;
  niu?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  poste?: string;
  service?: string;
  classificationProfessionnelle?: string;
  echelonEnum?: string;
  categorieEnum?: string;
  dateEmbauche?: string;
  typeContratEnum?: string;
  dateNaissance?: string;
  sexe?: string;
  nationalite?: string;
  ville?: string;
}

export interface EntrepriseResponseDto {
  id?: number;
  nom?: string;
  adresseEntreprise?: string;
  emailEntreprise?: string;
  telephoneEntreprise?: string;
  numeroSiret?: string;
  dateCreation?: string;
}
