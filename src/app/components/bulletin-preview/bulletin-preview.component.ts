import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinPaieResponseDto, BulletinService } from '../../services/bulletin.service';
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
  private readonly bulletinService = inject(BulletinService);

  @Input() bulletinData: BulletinPaieResponseDto | null = null;
  @Input() employeData: Employe | null = null;
  
  errorMessage: string | null = null;

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
    if (!this.bulletinData || this.bulletinData.id === undefined || this.bulletinData.id === null) {
      console.error("Impossible de télécharger le PDF : l'ID du bulletin est manquant.");
      this.toastrService.warning("Impossible de télécharger le PDF : le bulletin doit d'abord être calculé et avoir un ID.");
      this.errorMessage = "Impossible de télécharger le PDF : l'ID du bulletin est manquant.";
      return;
    }

    const bulletinId = this.bulletinData.id;
    this.errorMessage = null;

    this.bulletinService.downloadBulletinPdf(bulletinId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin_paie_${bulletinId}.pdf`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        console.log('PDF téléchargé avec succès.');
        this.toastrService.success('Le bulletin de paie a été téléchargé avec succès.', 'Téléchargement réussi');
      },
      error: (err) => {
        console.error("Erreur lors du téléchargement du PDF: ", err);
        const status = err.status || 'unknown';
        const message = err.message || 'Le fichier PDF n\'a pas pu être généré ou trouvé.';
        this.errorMessage = `Erreur lors du téléchargement du PDF: ${status} - ${message}`;

        if (err.status === 403) {
          this.toastrService.error('Accès non autorisé au PDF. Vérifiez vos permissions.', 'Accès refusé');
        } else if (err.status === 404) {
          this.toastrService.error('Le PDF demandé n\'a pas été trouvé.', 'Fichier non trouvé');
        } else {
          this.toastrService.error('Une erreur est survenue lors du téléchargement du PDF.', 'Erreur PDF');
        }
      }
    });
  }
}
