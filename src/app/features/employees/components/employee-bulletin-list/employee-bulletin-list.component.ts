import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { BulletinPaieResponseDto, BulletinService } from '../../../payroll/services/bulletin.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-bulletin-list',
  imports: [CommonModule],
  templateUrl: './employee-bulletin-list.component.html',
  styleUrl: './employee-bulletin-list.component.css'
})
export class EmployeeBulletinListComponent implements OnInit {
  bulletins: BulletinPaieResponseDto [] = [];
  isLoading: boolean = true;
  error: string | null = null;


  private readonly bulletinService = inject(BulletinService);
  private readonly authService = inject (AuthService);
  private readonly router = inject (Router);
  private readonly toastrService = inject(ToastrService);


  ngOnInit(): void {
    if (this.authService.hasRole('EMPLOYE')){
      this.fetchMyBulletins();
    } else {
      this.error = 'Acces non autorise. Vous devez etre un employe pour voir cette page.';
      this.isLoading = false;
      this.router.navigate(['/access-denied']);
    }
  }

  fetchMyBulletins(): void {
    this.isLoading = true;
    this.bulletinService.getMyBulletins().subscribe({
      next:(data) => {
        this.bulletins = data;
        this.isLoading = false;
        this.error = null;
      },
      error: (err) =>{
        console.error('Erreur lors du chargement des bulletins', err);
        this.error = 'Erreur lors du chargement des bulletins: ' + (err.error?.message || err.message);
        this.isLoading = false;
      }
        });

  }

  downloadPdf(id: number): void {
     this.bulletinService.downloadBulletinPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin_paie_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.toastrService.success('Téléchargement du PDF réussi.');
      },
      error: (err) => {
       this.toastrService.error('Erreur lors du téléchargement du PDF: ' + (err.error?.message || err.message || 'Le fichier PDF n\'a pas pu être généré ou trouvé.'));
        console.error(err);
      }
    });
    }

     viewBulletin(id: number): void {
    this.router.navigate(['/dashboard/bulletins', id]);
  }

}
