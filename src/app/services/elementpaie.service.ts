import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElementPaie } from '../model/elementpaie';

@Injectable({
  providedIn: 'root'
})
export class ElementpaieService {

  constructor() { }

 private readonly baseUrl = environment.apiUrl +'/api/element-paie';
  private readonly http = inject(HttpClient);

   getAll(): Observable<ElementPaie[]> {
    return this.http.get<ElementPaie[]>(this.baseUrl);
  }

  getById(id: number): Observable<ElementPaie> {
    return this.http.get<ElementPaie>(`${this.baseUrl}/${id}`);
  }

  create(element: ElementPaie): Observable<ElementPaie> {
    return this.http.post<ElementPaie>(this.baseUrl, element);
  }

  update(id: number, element: ElementPaie): Observable<ElementPaie> {
    return this.http.put<ElementPaie>(`${this.baseUrl}/${id}`, element);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

}
