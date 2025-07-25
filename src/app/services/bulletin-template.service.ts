import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BulletinTemplate, TemplateElementPaieConfig } from '../model/bulletin-template';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BulletinTemplateService {

  constructor() { }

  private readonly baseUrl = environment.apiUrl + '/api/templates';
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);


  getAll(): Observable<BulletinTemplate[]> {
    return this.http.get<BulletinTemplate[]>(this.baseUrl);
  }

  getById(id: number): Observable<BulletinTemplate> {
    return this.http.get<BulletinTemplate>(`${this.baseUrl}/${id}`);
  }

  create(template: BulletinTemplate): Observable<BulletinTemplate> {
    // Tu dois fournir entrepriseId dans le DTO pour l’URL
    return this.http.post<BulletinTemplate>(
      `${this.baseUrl}/entreprise/${template.entrepriseId}`, template
    );
  }

  update(id: number, template: BulletinTemplate): Observable<BulletinTemplate> {
    return this.http.put<BulletinTemplate>(
      `${this.baseUrl}/${id}`, template
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addElement(templateId: number, config: TemplateElementPaieConfig): Observable<TemplateElementPaieConfig> {
    return this.http.post<TemplateElementPaieConfig>(`${this.baseUrl}/${templateId}/elements`, config);
  }

  removeElement(templateId: number, elementPaieId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${templateId}/elements/${elementPaieId}`);
  }

  setDefault(id: number) {
  return this.http.put(`${this.baseUrl}/${id}/set-default`, {});
}


getAllByEntreprise(entrepriseId: number) {
  return this.http.get<BulletinTemplate[]>(`${this.baseUrl}/entreprise/${entrepriseId}`);
}

duplicateDefaultTemplateToEntreprise(entrepriseId: number) {
  return this.http.post<BulletinTemplate>(
    `${this.baseUrl}/duplicate-default/${entrepriseId}`,
    {} 
  );
}



}
