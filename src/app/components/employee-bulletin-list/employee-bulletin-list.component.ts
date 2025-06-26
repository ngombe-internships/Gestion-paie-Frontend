import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { BulletinPaieResponseDto, BulletinService } from '../../services/bulletin.service';
import { AuthService } from '../../services/auth.service';

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
    }

}
