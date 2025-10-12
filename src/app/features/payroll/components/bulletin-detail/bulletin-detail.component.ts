import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BulletinService } from '../../services/bulletin.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth.service';

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
  private readonly authService = inject (AuthService);

  bulletinId: number | null = null;
  bulletinHtml: SafeHtml | undefined;
  errorMessage: string | undefined;
  loading: boolean = false;
  userRole: string | null = null;

  ngOnInit(): void {
    this.authService.userRole$.subscribe(role => {
      this.userRole = role;
      console.log('BulletinDetailComponent - User Role:', this.userRole); // Pour le débogage
    });

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
    if (this.userRole) { // Vérifiez que le rôle de l'utilisateur est bien défini
      if (this.userRole === 'EMPLOYE') {
        // Si l'utilisateur est un EMPLOYÉ, redirigez-le vers sa liste de bulletins
        this.router.navigate(['/dashboard/employeBulletin']);
      } else if (this.userRole === 'EMPLOYEUR' || this.userRole === 'ADMIN') { // Ajoutez 'ADMIN' si les administrateurs accèdent aussi à cette vue
        // Si l'utilisateur est un EMPLOYEUR ou ADMIN, redirigez-le vers la liste générale des bulletins
        this.router.navigate(['/dashboard/bulletins/employeur']);
      } else {
        // Cas de fallback si le rôle n'est pas géré ou inconnu
        console.warn('Rôle utilisateur non géré pour la redirection:', this.userRole);
        this.toastrService.warning('Impossible de déterminer la page de retour. Redirection vers le tableau de bord.');
        this.router.navigate(['/dashboard']); // Redirection vers un tableau de bord par défaut
      }
    } else {
      // Si le userRole n'est pas encore défini (par exemple, si l'observable n'a pas encore émis)
      console.warn('Rôle utilisateur non disponible lors du clic sur le bouton de retour. Redirection par défaut.');
      // Tentative de récupérer le rôle directement si le subject n'a pas encore émis
      const roleFromService = this.authService.getUserRole();
      if (roleFromService === 'EMPLOYE') {
          this.router.navigate(['/dashboard/employeBulletin']);
      } else if (roleFromService === 'EMPLOYEUR' || roleFromService === 'ADMIN') {
          this.router.navigate(['/dashboard/bulletins/employeur']);
      } else {
          this.router.navigate(['/dashboard']);
      }
    }
  }


}
