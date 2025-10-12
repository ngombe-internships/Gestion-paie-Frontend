import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {

  private readonly baseUrl = environment.apiUrl + '/api/audit-logs'; // Assurez-vous d'avoir environment.ts configuré
  private readonly http = inject(HttpClient);
  constructor() { }

   getAuditLogs(params: {
    page?: number,
    size?: number,
    username?: string,
    entityName?: string,
    entityId?: number,
    action?: string
  } = {}): Observable<AuditLogPage> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.username) httpParams = httpParams.set('username', params.username);
    if (params.entityName) httpParams = httpParams.set('entityName', params.entityName);
    if (params.entityId !== undefined) httpParams = httpParams.set('entityId', params.entityId.toString());
    if (params.action) httpParams = httpParams.set('action', params.action);
    return this.http.get<AuditLogPage>(this.baseUrl, { params: httpParams });
  }

  exportAuditLogsPdf(from: string, to: string): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/pdf`,
      { from, to },
      { responseType: 'blob' }
    );
  }


}

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: number;
  username: string;
  dateAction: string;
  details: string;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
