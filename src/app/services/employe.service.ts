import { DashboardMetric } from './dashboard.service';
import { Employe } from './../model/employe';
import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EmployeCreate } from '../model/employeCreate';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private readonly baseUrl = environment.apiUrl + '/api/employes';
  private readonly http = inject(HttpClient);

  constructor() { }


  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<ApiResponse<Employe[]>>(`${this.baseUrl}`).pipe(
      map(response => response.data)
    );
  }

  getEmployeById(id: number) : Observable <Employe> {
    return this.http.get<ApiResponse<Employe>> (`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
  getMyEmployeProfile(): Observable<Employe> {
    return this.http.get<ApiResponse<Employe>>(`${this.baseUrl}/my-profile`).pipe(
      map (response => response.data)
    )
  }

  createEmploye (employe: EmployeCreate): Observable <Employe> {
    return this.http.post<ApiResponse<Employe>> (`${this.baseUrl}`, employe).pipe(
      map( response => response.data)
    );
  }

  uptadeEmploye (id: number, employe: EmployeCreate) : Observable <Employe> {
    return this.http.put<ApiResponse<Employe>> (`${this.baseUrl}/${id}`, employe) .pipe(
      map(response => response.data)
    );
  }

  deleteEmploye(id: number): Observable <void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  searchEmployes (searchTerm?:string ) : Observable<Employe []> {
    let params = new HttpParams();
    if(searchTerm) {
      params = params.set('searchTerm', searchTerm)
    }


    return this.http.get<ApiResponse<Employe[]>>(`${this.baseUrl}/search`, {params}) .pipe (
      map (response => response.data)
    );
  }

  getEmployeurCountForEmployer(): Observable<ApiResponse<number>>{
    return this.http.get<ApiResponse<number>>(`${this.baseUrl}/count`)
  }

}



interface ApiResponse <T> {
  message : string;
  data : T;
  statut : HttpStatusCode;
}



