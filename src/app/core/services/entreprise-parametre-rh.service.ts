import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseParametreRhService {
constructor() { }

    private readonly baseUrl = environment.apiUrl +'/api/entreprises';
    private readonly http = inject(HttpClient);

      getAll(entrepriseId: number): Observable<EntrepriseParametreRh[]> {
     return this.http.get<EntrepriseParametreRh[]>(`${this.baseUrl}/${entrepriseId}/parametres-rh`);
  }

    // Mise à jour d'un paramètre RH (valeur seulement)
  update(param: EntrepriseParametreRh): Observable<EntrepriseParametreRh> {
    return this.http.put<EntrepriseParametreRh>(
      `${this.baseUrl}/${param.entrepriseId}/parametres-rh/${param.id}`,
      param
    );
  }

}

export interface EntrepriseParametreRh {
  id: number;
  entrepriseId: number;
  cleParametre: string;
  valeurParametre: string;
  typeParametre?: string;
  description?: string;
}
