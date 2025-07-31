import { ActivatedRoute, Router } from '@angular/router';
import { EntrepriseDto } from './../../model/entrepriseDto';
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

  entreprise: EntrepriseDto | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  entrepriseId: number | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly authService = inject(AuthService);
  currentUserRole: string | null = null;

  ngOnInit(): void {
    this.currentUserRole = this.authService.getUserRole();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      // Si c'est un EMPLOYEUR et qu'il n'y a pas d'ID dans l'URL, on charge ses propres infos
      if (this.currentUserRole === 'EMPLOYEUR' && !idParam) {
        this.loadEmployeurOwnCompany();
      }
      // Si c'est un ADMIN avec un ID, on charge l'entreprise spécifique
      else if (idParam) {
        this.entrepriseId = +idParam;
        this.loadEntrepriseDetails(this.entrepriseId);
      }
      // Sinon erreur
      else {
        this.errorMessage = 'Identifiant de l\'entreprise non fourni dans l\'URL.';
        this.isLoading = false;
      }
    });
  }

  // Méthode pour charger les détails d'une entreprise spécifique (contexte ADMIN)
  loadEntrepriseDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    // CORRECTION: Utiliser getMyEmployeProfile pour les admins aussi
    // car cette méthode a été corrigée pour utiliser l'endpoint admin
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

  // Méthode pour qu'un employeur charge ses propres informations d'entreprise
  loadEmployeurOwnCompany(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.entrepriseService.getEntrepriseForEmployeur().subscribe({
      next: (data) => {
        this.entreprise = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails de l\'entreprise : ', error);
        this.errorMessage = 'Impossible de charger les détails de votre entreprise.';
        this.isLoading = false;
      }
    });
  }

  goBackToList(): void {
    if (this.currentUserRole === 'ADMIN') {
      this.router.navigate(['/dashboard/employeur']);
    } else if (this.currentUserRole === 'EMPLOYEUR') {
      // Pour un employeur, retourner vers son dashboard ou une autre page appropriée
      this.router.navigate(['/dashboard/dashEmployeur']);
    }
  }

  // company details
  goToOwnCompanyDetails(): void {
    if (this.currentUserRole === 'EMPLOYEUR') {
      this.router.navigate(['/dashboard/entreprise/edit']); // Navigate to the path for employer's own company details
    }
  }
}
