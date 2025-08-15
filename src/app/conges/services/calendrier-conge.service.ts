import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  CalendrierMoisDto,
  AbsenceJourneeDto,
  EffectifJournalierDto
} from '../models/calendrier-conge.model';
import { environment } from '../../../environment';
import { ApiResponse } from '../../model/ApiResponse';


@Injectable({
  providedIn: 'root'
})
export class CalendrierCongeService {
  private apiUrl = `${environment.apiUrl}/api/conge/calendrier`;

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

  getCalendrierMensuel(annee: number, mois: number): Observable<ApiResponse<CalendrierMoisDto>> {
    return this.http.get<ApiResponse<CalendrierMoisDto>>(
      `${this.apiUrl}/complet/${annee}/${mois}`,
      this.getHttpOptions()
    );
  }

  getAbsencesMensuelles(annee: number, mois: number): Observable<ApiResponse<AbsenceJourneeDto[]>> {
    return this.http.get<ApiResponse<AbsenceJourneeDto[]>>(
      `${this.apiUrl}/${annee}/${mois}`,
      this.getHttpOptions()
    );
  }

  getDemandesEnAttente(): Observable<ApiResponse<AbsenceJourneeDto[]>> {
    return this.http.get<ApiResponse<AbsenceJourneeDto[]>>(
      `${this.apiUrl}/demandes-attente`,
      this.getHttpOptions()
    );
  }

  detecterConflitsPotentiels(nbJours: number = 30): Observable<ApiResponse<EffectifJournalierDto[]>> {
    return this.http.get<ApiResponse<EffectifJournalierDto[]>>(
      `${this.apiUrl}/conflits-potentiels?nbJours=${nbJours}`,
      this.getHttpOptions()
    );
  }

  analyserImpactDemandeConge(dateDebut: string, dateFin: string): Observable<ApiResponse<EffectifJournalierDto[]>> {
    return this.http.get<ApiResponse<EffectifJournalierDto[]>>(
      `${this.apiUrl}/analyser-impact?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      this.getHttpOptions()
    );
  }

  exporterCalendrier(annee: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/export/${annee}`, {
      ...this.getHttpOptions(),
      responseType: 'text'
    });
  }


}
