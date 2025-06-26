import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BulletinService } from '../../services/bulletin.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bulletin-detail',
  standalone:true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulletin-detail.component.html',
  styleUrl: './bulletin-detail.component.css'
})
export class BulletinDetailComponent implements OnInit{
  private readonly bulletinService = inject (BulletinService);
  private readonly sanitizer = inject (DomSanitizer)
  private readonly route = inject (ActivatedRoute);
  private readonly toastrService = inject(ToastrService);
  private readonly router = inject(Router);

  bulletinId: number | null = null;
  bulletinHtml: SafeHtml | undefined;
  errorMessage: string | undefined;
  loading: boolean = false;

  ngOnInit(): void {
  this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        // 'id' doit correspondre au nom du paramètre dans votre route (/bulletins/:id)
        const idString = params.get('id');
        if (idString) {
          this.bulletinId = +idString; // Convertit la chaîne en nombre
          this.errorMessage = undefined; // Réinitialise l'erreur
          return this.bulletinService.getBulletinPreviewHtml(this.bulletinId);
        } else {
          this.errorMessage = "ID du bulletin non trouvé dans l'URL.";
          this.loading = false;
          return new Observable<string>(); // Retourne un observable vide si pas d'ID
        }
      })
    ).subscribe({
      next: (htmlContent: string) => {
        this.bulletinHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
        this.loading = false;
      },
      error: (error) => {
        console.error("Erreur lors de la récupération du bulletin HTML :", error);
        this.errorMessage = `Erreur: ${error.status} - ${error.message || 'Impossible de charger le bulletin.'}`;
        this.loading = false;
      }
    });
  }


  downloadPdf(): void {
    if(this.bulletinId === null) {
      this.errorMessage = "Impossible de telecharger le PDF : Id du bulletin manquant.";
      return;
    }
    this.bulletinService.downloadBulletinPdf(this.bulletinId).subscribe({
      next: (blob) =>{
        const  url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download= `bulletin_paie_${this.bulletinId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

      },
      error: (err) => {
        console.error("Erreur lors du telechargement du PDF: ", err);
        this.errorMessage = `Erreur lors du telechargement du PDF: ${err.status} - ${err.message} || 'Le fichier PDF n\'a pas pu etre genere ou trouve'}`;

      }
    });
  }

   goBackToList(): void {
    this.router.navigate(['/dashboard/bulletins/employeur']); // Assurez-vous que c'est la bonne route vers votre liste
  }


}
