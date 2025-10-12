import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { EmployePaieConfig } from '../models/employeConfig';
import { PagedResponse } from './bulletin.service';

@Injectable({
  providedIn: 'root'
})
export class EmployePaieConfigService {

  constructor() { }

  private readonly http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/employe-paie-config'


 getEmployePaieConfigs(): Observable<EmployePaieConfig[]> {
  // Utilise le endpoint sécurisé pour "mon entreprise"
  return this.http.get<EmployePaieConfig[]>(this.baseUrl + '/my-company');
}

   getEmployePaieConfigById(id: number): Observable<EmployePaieConfig> {
    return this.http.get<EmployePaieConfig>(`${this.baseUrl}/${id}`);
  }

  createEmployePaieConfig(employeId:number, elementPaieId: number, config: EmployePaieConfig): Observable<EmployePaieConfig>{

    const payload = {
      taux:config.taux ?? null,
      montant:config.montant?? null,
      dateDebut: config.dateDebut,
      dateFin: config.dateFin || null
    }
     return this.http.post<EmployePaieConfig>(`${this.baseUrl}/employe/${employeId}/element/${elementPaieId}`, payload);
  }
     updateEmployePaieConfig(id: number, config: EmployePaieConfig): Observable<EmployePaieConfig> {

      const payload = {
        taux:config.taux ?? null,
        montant:config.montant ?? null,
        dateDebut: config.dateDebut,
        dateFin: config.dateFin || null
    };
    return this.http.put<EmployePaieConfig>(`${this.baseUrl}/${id}`, payload);
  }

  deleteEmployePaieConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);

  }


   searchEmployePaieConfigs(
    employeId?: number,
    elementPaieId?: number,
    status: string = 'all',
    searchTerm: string = '',
    page: number = 0,
    size: number = 10
  ): Observable<PagedResponse<EmployePaieConfig>> {
    const params: any = { status, searchTerm, page, size };
    if (employeId) params.employeId = employeId;
    if (elementPaieId) params.elementPaieId = elementPaieId;
    return this.http.get<PagedResponse<EmployePaieConfig>>(
      `${this.baseUrl}/my-company/search`, { params }
    );
  }




}
