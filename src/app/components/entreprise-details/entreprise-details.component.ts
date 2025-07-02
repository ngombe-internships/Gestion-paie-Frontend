import { ActivatedRoute, Router } from '@angular/router';
import { routes } from './../../app.routes';
import { Entreprise } from './../../model/entreprise';
import { Component, inject, OnInit } from '@angular/core';
import { EntrepriseService } from '../../services/entreprise.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-entreprise-details',
  imports: [CommonModule, DatePipe],
  templateUrl: './entreprise-details.component.html',
  styleUrl: './entreprise-details.component.css'
})
export class EntrepriseDetailsComponent implements OnInit {

  entreprise: Entreprise | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  entrepriseId: number | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly authService = inject(AuthService);
 currentUserRole: string | null = null;


  ngOnInit(): void {
    this.currentUserRole = this.authService.getUserRole(); // Récupérer le rôle de l'utilisateur

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.entrepriseId = +idParam;
        this.loadEntrepriseDetails(this.entrepriseId);
      } else {
        this.errorMessage = 'Identifiant de l\'entreprise non fourni dans l\'URL.';
        this.isLoading = false;
      }
    });
  }

  loadEntrepriseDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.entrepriseService.getMyEmployeProfile(id).subscribe({
      next: (data) => {
        this.entreprise = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails de l\'entreprise : ', error);
        this.errorMessage = 'Impossible de charger les détails de l\'entreprise.';
        this.isLoading = false;
      }
    });
  }

  goBackToList(): void {
    this.router.navigate(['/dashboard/employeur']);
  }


}
