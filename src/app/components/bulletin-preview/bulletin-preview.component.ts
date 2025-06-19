import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinPaieResponseDto } from '../../services/bulletin.service';
import { Employe } from '../../model/employe';

@Component({
  selector: 'app-bulletin-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulletin-preview.component.html',
  styleUrl: './bulletin-preview.component.css'
})
export class BulletinPreviewComponent implements OnChanges {
  private readonly http = inject (HttpClient);

  @Input() bulletinData: BulletinPaieResponseDto | null = null;
  @Input() employeData: Employe | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bulletinData'] && changes['bulletinData'].currentValue) {
      console.log('Données du bulletin reçues dans la prévisualisation:', this.bulletinData);
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
    if (this.bulletinData) {
      this.http.post("http://localhost:8081/api/bulletins/pdf", this.bulletinData,{
        responseType: 'blob'
      }).subscribe(
        (response: Blob) => {
          const fileUrl = URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = fileUrl;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(fileUrl)
        },
        (error) => {
          console.error('Erreur lors de la generation du pdf :', error)
        }
      )

    }
  }
}
