
import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Employe } from '../models/employe';
import { PagedResponse } from '../../payroll/services/bulletin.service';
import { EmployeCreate } from '../models/employeCreate';


@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private readonly baseUrl = environment.apiUrl + '/api/employes';
  private readonly http = inject(HttpClient);


  constructor() { }


  getAllEmployesForRegister(): Observable<Employe[]> {
  return this.http.get<ApiResponse<Employe[]>>(`${this.baseUrl}/all`).pipe(
    map(res => res.data)
  );
}

   getEmployesPaginated(page: number = 0, size: number = 10, search: string = ''): Observable<ApiResponse<PagedResponse<Employe>>> {
    let url = `${this.baseUrl}?page=${page}&size=${size}`;
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<ApiResponse<PagedResponse<Employe>>>(url);
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



