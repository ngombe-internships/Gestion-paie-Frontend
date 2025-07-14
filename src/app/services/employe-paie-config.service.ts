import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { Observable } from 'rxjs';
import { EmployePaieConfig } from '../model/employeConfig';

@Injectable({
  providedIn: 'root'
})
export class EmployePaieConfigService {

  constructor() { }

  private readonly http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/employe-paie-config'


  getEmployePaieConfigs(): Observable<EmployePaieConfig[]> {
    return this.http.get<EmployePaieConfig[]>(this.baseUrl);
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



}
