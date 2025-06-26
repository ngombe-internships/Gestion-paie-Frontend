import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinPaieResponseDto } from '../../services/bulletin.service';
import { Employe } from '../../model/employe';
import {  ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bulletin-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulletin-preview.component.html',
  styleUrl: './bulletin-preview.component.css'
})
export class BulletinPreviewComponent implements OnChanges {
  private readonly http = inject (HttpClient);
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);

  @Input() bulletinData: BulletinPaieResponseDto | null = null;
  @Input() employeData: Employe | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bulletinData'] && changes['bulletinData'].currentValue) {
      console.log('Données du bulletin reçues dans la prévisualisation:', this.bulletinData);
      if (this.bulletinData && this.bulletinData.id) {
        console.log('ID du bulletin disponible pour PDF :', this.bulletinData.id);
      } else {
        console.warn('ID du bulletin manquant dans bulletinData pour la generation PDF');
      }
    }
  }

  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0,00';
    }
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // // Méthode pour vérifier si on a des données à afficher
  // hasData(): boolean {
  //   return this.bulletinData !== null && this.bulletinData !== undefined;
  // }

  generatePdf(): void {
   if(!this.bulletinData || this.bulletinData.id === undefined || this.bulletinData.id === null){
    console.error("Impossible de generer le PDF: l'ID du bulletin est manquant.");
    this.toastrService.warning("Impossible de geneer le pdf: le bulletin doit d'abord etre calculer et avoir un ID.");
    return;
  }

  const bulletinId = this.bulletinData.id;
  const apiUrl = `http://localhost:8081/api/bulletins/pdf/${bulletinId}`;

  //recupere le token
  const authToken = this.authService.getToken();
  if(!authToken) {
    this.toastrService.error('vous n\'etes pas authentifie. veuillez vous connecter.','Acces refuse');
  }

  //cree en tete en incluant le token
  const headers = new HttpHeaders ({

      'Accept': 'application/pdf',
      'Authorization': `Bearer &${authToken}`
  });


  this.http.get(apiUrl,{
    responseType: 'blob',
    headers: headers
  }).subscribe(
    (response: Blob) => {
      const fileUrl = URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = `bulletin_paie_${bulletinId}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fileUrl);
      console.log('PDF genere et telecharge avec succes.')
    },
    (error) => {
      console.error('Erreur lors de la generation du pdf :', error);

      if (error.status === 403) {
            this.toastrService.error('Accès non autorisé au PDF. Vérifiez vos permissions.', 'Accès refusé');
        } else {
            this.toastrService.error('Erreur lors de la génération du PDF. Vérifiez la console et les logs du serveur.', 'Erreur PDF');
        }
      }
  );

  }
}
