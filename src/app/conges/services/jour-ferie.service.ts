import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../model/ApiResponse';

export interface JourFerieDto {
  id: number;
  dateFerie: string;
  nom: string;
  typeFerie: string;
  actif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JourFerieService {
  private apiUrl = `${environment.apiUrl}/api/jours-feries`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getAllJoursFeries(): Observable<ApiResponse<JourFerieDto[]>> {
    return this.http.get<ApiResponse<JourFerieDto[]>>(
      this.apiUrl,
      this.getHttpOptions()
    );
  }

  getJourFerieByDate(date: string): Observable<JourFerieDto> {
    return this.http.get<JourFerieDto>(
      `${this.apiUrl}/date/${date}`,
      this.getHttpOptions()
    );
  }
}
