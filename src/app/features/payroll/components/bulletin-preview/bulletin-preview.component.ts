import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinPaieResponseDto, BulletinService } from '../../services/bulletin.service';
import {  ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth.service';
import { Employe } from '../../../employees/models/employe';


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
    if (!this.bulletinData || !this.bulletinData.id) {
        this.toastrService.error("Le bulletin doit d'abord être calculé et sauvegardé");
        return;
    }

    this.toastrService.info('Génération du PDF en cours...', 'Patientez');

    this.bulletinService.downloadBulletinPdf(this.bulletinData.id).subscribe({
        next: (blob: Blob) => {
            try {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bulletin_paie_${this.bulletinData?.employe?.nom || ''}_${this.bulletinData?.employe?.prenom || ''}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                this.toastrService.success('PDF généré avec succès');
            } catch (e) {
                console.error('Erreur lors du traitement du PDF:', e);
                this.toastrService.error('Erreur lors du traitement du PDF');
            }
        },
        error: (error) => {
            console.error('Erreur lors de la génération du PDF:', error);
            let errorMessage = 'Erreur lors de la génération du PDF';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.status === 404) {
                errorMessage = 'Bulletin non trouvé';
            } else if (error.status === 403) {
                errorMessage = 'Accès non autorisé';
            } else if (error.status === 500) {
                errorMessage = 'Erreur serveur lors de la génération du PDF';
            }

            this.toastrService.error(errorMessage, 'Erreur');
        }
    });
  }
}
