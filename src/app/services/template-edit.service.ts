import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TemplateElementPaieConfigDto } from '../model/templateElementpaie';

@Injectable({
  providedIn: 'root'
})
export class TemplateEditService {

  private readonly baseUrl = environment.apiUrl +'/api/templates';
  private readonly http = inject(HttpClient);
  constructor() { }



  addElementToTemplate(templateId: number, element: TemplateElementPaieConfigDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/${templateId}/elements`, element);
  }


}
