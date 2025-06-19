import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BulletinPaie } from '../model/bulletin';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {
  private readonly baseUrl = 'http://localhost:8081/api/bulletins';
  private readonly http = inject(HttpClient);

  constructor() { }

  // Méthode pour calculer le bulletin
  calculerBulletin(fiche: BulletinPaie): Observable<ApiResponse<BulletinPaieResponseDto>> {
    return this.http.post<ApiResponse<BulletinPaieResponseDto>>(`${this.baseUrl}/calculate`, fiche);
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
}


interface ApiResponse<T> {
  message: string;
  data: T;
  statut: HttpStatusCode;
}

// Interface pour la réponse du bulletin calculé
export interface BulletinPaieResponseDto {
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
}
