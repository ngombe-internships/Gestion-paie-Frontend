import { EntrepriseService } from './../../services/entreprise.service';
import { Component, inject, OnInit } from '@angular/core';
import { EmployeurList } from '../../model/employeurList';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog1Component } from '../../confirm-dialog1/confirm-dialog1.component';

@Component({
  selector: 'app-employeur-list',
  imports: [CommonModule,FormsModule,MatDialogModule],
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
     private readonly dialog = inject(MatDialog);


  ngOnInit(): void {
    this.loadEmployeur();
  }

  loadEmployeur(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.entrepriseService.getEmployersList().subscribe({
      next: (employeurs) => {
        this.employeurs = employeurs.sort((a,b) => {
          if(a.active && !b.active){
            return -1;
          }
          if(!a.active && b.active){
            return 1;
          }
        return a.nomEntreprise.localeCompare(b.nomEntreprise);
        });
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

   toggleEntrepriseStatus(id: number, currentStatus: boolean): void{
    const newStatus = !currentStatus;
    const dialogTitle = newStatus ? 'Activer le compte ' : 'Desactiver le compte';
    const dialogMessage = newStatus ?
       'Êtes-vous sûr de vouloir activer cette entreprise ? Leurs accès seront rétablis.' :
       'Êtes-vous sûr de vouloir désactiver cette entreprise ? Cela bloquera la connexion de l\'employeur et de ses employés de manière permanente.';

    const confirmButtonText = newStatus ? 'Activer' : 'Désactiver'; // Texte du bouton Confirmer
    const confirmButtonClass = newStatus ? 'btn-success' : 'btn-danger';
     //ouvre le dialigue de confirmation
    this.dialog.open(ConfirmDialog1Component,{
      data:{
        title: dialogTitle,
      message: dialogMessage,
      confirmButtonText: confirmButtonText,
      confirmButtonClass: confirmButtonClass
    }
   }).afterClosed().subscribe(result => {
    if(result){
      this.entrepriseService.toggleEntrepriseStatus(id, newStatus).subscribe({
        next: (response) =>{
          console.log(response.message);
          const index = this.employeurs.findIndex(emp => emp.entrepriseId === id);
          if(index !== -1){
            this.employeurs[index].active = newStatus;
            this.employeurs.sort((a, b) =>{
              if(a.active && !b.active) return -1;
              if(!a.active && b.active) return 1;
              return a.nomEntreprise.localeCompare(b.nomEntreprise);
            });
          }
        },
        error: (error) =>{
            console.error('Erreur lors du changement de statut de l\'entreprise : ', error);
         }
      });
    }
   });


  }

   editEntreprise(id: number | undefined): void {
  if (id) {
    this.router.navigate(['/dashboard/register/employer-company', id]);
  } else {
    console.error('ID entreprise non défini');
  }
}


   get filteredEmployeurs(): EmployeurList[]{
    if(!this.searchText){
      return this.employeurs;
    }
    const lowerCaseSearchText =this.searchText.toLowerCase();
    return this.employeurs.filter(emp =>
      emp.nomEntreprise.toLowerCase().includes(lowerCaseSearchText) ||
      emp.usernameEmployeur.toLowerCase().includes(lowerCaseSearchText) ||
      emp.entrepriseId.toString().includes(lowerCaseSearchText)
    )
     }

}
