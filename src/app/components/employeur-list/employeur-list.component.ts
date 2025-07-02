import { EntrepriseService } from './../../services/entreprise.service';
import { Component, inject, OnInit } from '@angular/core';
import { EmployeurList } from '../../model/employeurList';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employeur-list',
  imports: [CommonModule],
  templateUrl: './employeur-list.component.html',
  styleUrl: './employeur-list.component.css'
})
export class EmployeurListComponent implements OnInit {

     employeurs: EmployeurList[] = [];
     isLoading: boolean = true;
     errorMessage: string | null = null;

     searchText: string = '';


     private readonly entrepriseService = inject(EntrepriseService)
     private readonly router = inject(Router);



  ngOnInit(): void {
    this.loadEmployeur();
  }

  loadEmployeur(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.entrepriseService.getEmployersList().subscribe({
      next: (data) => {
        this.employeurs = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employes : ', error);
        this.errorMessage = 'Impossible de charger la liste des employes.';
        this.isLoading = false;
      }
    });
  }

   goBackToList(id: number | undefined): void {
    if(id){
      console.log('Navigation vers édition employé ID:', id);
      console.log('Route utilisée:', '/employes/edit/' + id);
      this.router.navigate(['/dashboard/entrepriseDetail', id])
      .then(success => {
          console.log('Navigation réussie:', success);
        })
        .catch(error => {
          console.error('Erreur de navigation:', error);
        });
    } else {
      console.error('ID employé non défini');
    }
   }

}
