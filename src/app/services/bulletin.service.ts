import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BulletinPaie, BulletinPaieCreateDto } from '../model/bulletin';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Employe } from '../model/employe';
import { FormuleCalculType } from '../model/enum/enum';


@Injectable({
  providedIn: 'root'
})
export class BulletinService {
  private readonly baseUrl = environment.apiUrl +'/api/bulletins';
  private readonly http = inject(HttpClient);

  constructor() { }

  // Méthode pour calculer le bulletin
 calculerBulletin(fiche: BulletinPaieCreateDto): Observable<ApiResponse<BulletinPaieResponseDto>> {
  const headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

    return this.http.post<ApiResponse<BulletinPaieResponseDto>>(
        `${this.baseUrl}/calculate1`,
        fiche,
        { headers }
    );
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
  getBulletinsForEmployeurPaginated(
  page: number, size: number, search: string = '', statuts: string[] = []
   ): Observable<ApiResponse<PagedResponse<BulletinPaieEmployeurDto>>> {
  let url = `${this.baseUrl}/employeur/paginated?page=${page}&size=${size}`;
  if (search && search.trim() !== '') {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (statuts.length) {
    url += `&statuts=${statuts.join(',')}`;
  }
  return this.http.get<ApiResponse<PagedResponse<BulletinPaieEmployeurDto>>>(url);
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


  getBulletinPreviewHtml(id: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${id}/previews`, {responseType: 'text'});
  }

  getBulletinCountForEmployer(): Observable<ApiResponse<number>>{
      return this.http.get<ApiResponse<number>>(`${this.baseUrl}/count`)
    }

   downloadBulletinPdf(id: number): Observable<Blob> {
    const headers = new HttpHeaders({
        'Accept': 'application/pdf'
    });

    return this.http.get(`${this.baseUrl}/pdf/${id}`, {
        headers: headers,
        responseType: 'blob',
        observe: 'response'
    }).pipe(
        map(response => {
            if (response.status === 200 && response.body instanceof Blob) {
                // Vérifier que c'est bien un PDF
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/pdf')) {
                    return response.body;
                }
                throw new Error('Le fichier reçu n\'est pas un PDF');
            }
            throw new Error('Réponse invalide du serveur');
        }),
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Erreur lors de la génération du PDF';

            if (error.status === 404) {
                errorMessage = 'Bulletin non trouvé';
            } else if (error.status === 403) {
                errorMessage = 'Accès non autorisé';
            } else if (error.error instanceof Blob) {
                // Lire le message d'erreur du blob
                return new Observable<never>((observer) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorResponse = JSON.parse(reader.result as string);
                            observer.error(new Error(errorResponse.message || errorMessage));
                        } catch {
                            observer.error(new Error(errorMessage));
                        }
                    };
                    reader.onerror = () => observer.error(new Error('Erreur lors de la lecture de la réponse'));
                    reader.readAsText(error.error);
                });
            }

            return throwError(() => new Error(errorMessage));
        })
    );
}

}





interface ApiResponse<T> {
  message: string;
  data: T;
  statut: HttpStatusCode;
}

interface ErrorResponse {
    message: string;
    status: string;
    data: any;
}

// Interface pour la réponse du bulletin calculé
export interface BulletinPaieResponseDto {
  id?: number;
  employe?: Employe;
  heuresSup?: number;
  heuresNuit?: number;
  heuresFerie?: number;
  lignesPaie?: LignePaieDto[];
  salaireImposable?: number;
  salaireBrut?: number;
  baseCnps?: number;
  totalRetenuesSalariales?: number;
  totalChargesPatronales?: number;
  coutTotalEmployeur?: number;
  salaireNetAPayer?: number;
  totalGains?: number;
  cotisationCnps?: number;


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

  heuresSup?: number;
  heuresNuit?: number;
  heuresFerie?: number;
  lignesPaie?: LignePaieDto[];

  totalGains?: number;
  salaireBrut?: number;
  baseCnps?: number;
  salaireImposable?: number;

  totalImpots?: number;
  totalRetenuesSalariales?: number;
  totalChargesPatronales?: number;
  salaireNetAPayer?: number;
  cotisationCnps?: number;

  //nouveau
  statusBulletin?: 'GÉNÉRÉ' | 'VALIDÉ' | 'ENVOYÉ' | 'ARCHIVÉ' | 'ANNULÉ';
  periodePaie?: string;
  dateCreationBulletin?: string;
  datePaiement?: string;
  methodePaiement?: string;
  avancesSurSalaires?:number;

}
export interface LignePaieDto {
  designation?: string;
  nombre?: number;
  baseCalcul?: number;
  tauxApplique?: number;
  montantFinal?: number;
  type?: 'GAIN' | 'RETENUE' | 'CHARGE_PATRONALE';
  baseApplique?:number;
  formuleCalcul?: 'BAREME';
  tauxPatronal?:number;      // Patronale
 montantPatronal?: number;
 merged?:boolean;
 tauxPatronalAffiche?: string;
  tauxAffiche?:string;

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
  heuresContractuellesHebdomadaires: number;
  joursOuvrablesContractuelsHebdomadaires: number;
  SalaireBase: number;
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

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
