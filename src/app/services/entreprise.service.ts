import { EmployeurList } from './../model/employeurList';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Entreprise } from '../model/entreprise';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {

  constructor() { }

  private readonly baseUrl = environment.apiUrl +'/api/admin/entreprises';
  private readonly http = inject(HttpClient);

  getEmployersList(): Observable<EmployeurList[]> {
    return this.http.get<ApiResponse<EmployeurList[]>>(`${this.baseUrl}`).pipe(
      map(response => response.data )
    );
  }

  getMyEmployeProfile(id: number): Observable<Entreprise> {
    return this.http.get<ApiResponse<Entreprise>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data )
    );
  }

}

interface ApiResponse <T> {
  message : string;
  data : T;
  statut : HttpStatusCode;
}
