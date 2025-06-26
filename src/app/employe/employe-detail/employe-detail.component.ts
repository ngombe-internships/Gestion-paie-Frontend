
import { ActivatedRoute, Router, UrlSegment } from '@angular/router'; // Pour récupérer l'ID de l'URL et naviguer
import { CommonModule } from '@angular/common'; // Pour ngIf, ngFor, etc.
import { EmployeService } from '../../services/employe.service'; // Votre service pour les employés
import { Employe } from '../../model/employe'; // L'interface de votre modèle Employe
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employe-details',
  standalone: true,
  imports: [CommonModule], // Importez CommonModule pour les directives structurelles
 templateUrl: './employe-detail.component.html',
  styleUrl: './employe-detail.component.css'
})
export class EmployeDetailsComponent implements OnInit {
  employe: Employe | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isMyProfileView: boolean = false;
  currentUserRole: string | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeService = inject(EmployeService);
  private readonly authService = inject(AuthService);

  constructor() { }

  ngOnInit(): void {
    this.currentUserRole = this.authService.getUserRole();
    this.route.url.subscribe(segments =>{
      if(segments.some(segments => segments.path === 'mon-profil')){
        this.isMyProfileView = true;
        this.getMyProfileDetails();
      }else {
        this.route.paramMap.subscribe(params => {
          const employeId = params.get('id');
          if(employeId){
            this.getEmployeDetails(Number(employeId));
          } else {
            this.errorMessage = "ID de l'employe non fourni"
            this.isLoading = false;
          }
        });
      }
    })
  }


  getEmployeDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeService.getEmployeById(id).subscribe({
      next: (data) => {
        this.employe = data;
        this.isLoading = false;
        console.log('Détails de l\'employé chargés:', this.employe);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des détails de l\'employé:', err);
        this.errorMessage = `Impossible de charger les détails de l'employé. Erreur: ${err.message || 'Erreur inconnue'}`;
        this.isLoading = false;
      }
    });
  }


  getMyProfileDetails(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeService.getMyEmployeProfile().subscribe({
      next: (data) => {
        this.employe = data;
        this.isLoading = false;
        console.log('Mon profil charge: ' ,this.employe);
      },
      error: (err) => {
        console.error('Erreur lors de la recuperation de mon profil:', err);
        this.errorMessage =`Impossible de charger votre profil. Errreur: ${err.error?.message || 'Erreur inconnue'}`;
        this.isLoading = false;
      }
    })
  }





  editEmploye(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/dashboard/employes/edit', id]); // Assurez-vous que cette route existe
    }
  }

  goBackToList(): void {
    if (this.isMyProfileView) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/dashboard/employes']);
    }
  }


}
