import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../model/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {


  constructor() { }

  private readonly baseUrl = environment.apiUrl +'/api/dashboard/metrics';
  private readonly http = inject(HttpClient);

  getDashboardMetrics() : Observable<ApiResponse<DashboardMetric>> {
    return this.http.get<ApiResponse<DashboardMetric>>(`${this.baseUrl}`)
  }

}

 export interface DashboardMetric{

  nombreBulletins: number;
  nombreEmploye: number;
  nombreEntreprises:number
  }
