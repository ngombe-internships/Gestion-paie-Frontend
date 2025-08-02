import { EmployeurList } from './../model/employeurList';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Entreprise } from '../model/entreprise';
import { EntrepriseDto } from '../model/entrepriseDto';
import { EntrepriseUpdateDto } from '../model/entrepriseUpdateDto';
import { PagedResponse } from './bulletin.service';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {

  constructor() { }

  private readonly baseUrl = environment.apiUrl +'/api/admin/entreprises';
   private readonly baseUrlAdmin = environment.apiUrl + '/api/admin/entreprises';
  private readonly baseUrlEmployeur = environment.apiUrl + '/api/employer/entreprise';
  private readonly http = inject(HttpClient);


  getEmployersList1(
  nomEntreprise: string = '',
  usernameEmployeur: string = '',
  status: string = '', // 'active', 'inactive', ou ''
  page: number = 0,
  size: number = 10
): Observable<ApiResponse<PagedResponse<EmployeurList>>> {
  let params: any = { nomEntreprise, usernameEmployeur, page, size };
  if (status) params.active = status === 'active'; // backend attend un booléen

  return this.http.get<ApiResponse<PagedResponse<EmployeurList>>>(`${this.baseUrl}`, { params });
}

getEmployeurCounts(
    nomEntreprise: string = '',
    usernameEmployeur: string = ''
  ): Observable<{actifs: number, inactifs: number}> {
    let params: any = { nomEntreprise, usernameEmployeur };
    return this.http.get<{actifs: number, inactifs: number}>(`${this.baseUrl}/count`, { params });
  }



   getMyEmployeProfile(id: number): Observable<EntrepriseDto> {
    return this.http.get<ApiResponse<EntrepriseDto>>(`${this.baseUrlAdmin}/${id}`).pipe(
      map(response => response.data)
    );
  }

  toggleEntrepriseStatus(id: number, active:boolean):Observable <ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${id}/status?active=${active}`, {});
  }


 // Récupération des infos entreprise par ID (ADMIN)
  getEntrepriseByIdForAdmin(id: number): Observable<EntrepriseDto> {
    return this.http.get<ApiResponse<EntrepriseDto>>(`${this.baseUrlAdmin}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Récupération des infos de l'entreprise de l'employeur connecté (EMPLOYEUR)
  getEntrepriseForEmployeur(): Observable<EntrepriseDto> {
    return this.http.get<ApiResponse<EntrepriseDto>>(`${this.baseUrlEmployeur}/my-company`).pipe(
      map(response => response.data)
    );
  }

  // Update ADMIN (PUT)
  updateEntrepriseByAdmin(id: number, entrepriseDto: EntrepriseDto, logoFile?: File): Observable<ApiResponse<EntrepriseDto>> {
    const formData = new FormData();
    formData.append('entreprise', new Blob([JSON.stringify(entrepriseDto)], { type: 'application/json' }));
    if (logoFile) formData.append('logo', logoFile);
    return this.http.put<ApiResponse<EntrepriseDto>>(`${this.baseUrlAdmin}/${id}`, formData);
  }

  // Update EMPLOYEUR (PATCH)
  updateEntrepriseByEmployer(updateDto: EntrepriseUpdateDto, logoFile?: File): Observable<ApiResponse<EntrepriseDto>> {
    const formData = new FormData();
    formData.append('entreprise', new Blob([JSON.stringify(updateDto)], { type: 'application/json' }));
    if (logoFile) formData.append('logo', logoFile);
    return this.http.patch<ApiResponse<EntrepriseDto>>(`${this.baseUrlEmployeur}/my-company`, formData);
  }







}

interface ApiResponse <T> {
  message : string;
  data : T;
  statut : HttpStatusCode;
}
