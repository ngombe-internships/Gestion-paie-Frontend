import { Component, inject, OnInit } from '@angular/core';
import { EmployeService } from '../../services/employe.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employe } from '../../model/employe';

@Component({
  selector: 'app-employe-list',
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './employe-list.component.html',
  styleUrl: './employe-list.component.css'
})
export class EmployeListComponent implements OnInit {

  employes : Employe[] = [];
  isLoading : boolean = true;
  errorMessage : string | null = null;

  searchText: string = '';



  private readonly employeService = inject (EmployeService);
  private readonly router = inject (Router);
  constructor (){}


  ngOnInit() : void{

    this.loadEmployes();
  }

  loadEmployes(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.employeService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employes : ', error);
        this.errorMessage = 'Impossible de charger la liste des employes.';
        this.isLoading = false;
      }
    });
  }

  onSearch (): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeService.searchEmployes(this.searchText).subscribe({
      next: (data) => {
        this.employes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche : ', error);
        this.errorMessage = 'Une erreur est survenue lors de la recherche. ';
        this.isLoading = false;
      }
    });
  }

 clearSearch(): void {
      this.searchText ='';
      this.loadEmployes();
  }

  viewEmployeDetails (id: number | undefined) : void {
    if(id){
      this.router.navigate (['/employes',id])
    }
  }

  editEmploye(id: number  | undefined) : void {
    if (id) {
      console.log('Navigation vers édition employé ID:', id);
      console.log('Route utilisée:', '/employes/edit/' + id);
      this.router.navigate(['/employes/edit', id])
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

  goToCreateEmploye(): void {
    this.router.navigate([`/employes/create`]);
  }


  deleteEmploye(id: number |undefined): void {
    if(id && confirm ('Etes vous sur de vouloir supprimer cet employe ?')){
      this.employeService.deleteEmploye(id).subscribe({
        next: () => {
          console.log(`Employe avec ID ${id} supprime`);
          this.loadEmployes();
        },
        error: (error) => {
          console.error (`Erreur lors de la suppression de l'employe avec ID ${id} :`, error );
          this.errorMessage = `Impossible de supprimer l'employe. ${error.error?.message || '' }`;
        }
      });
    }
  }

  generateBulletin(employeId: number | undefined): void {
    if (employeId) {

      this.router.navigate(['/bulletins'], { queryParams: { employeId: employeId } });
    } else {
      console.error('Employee ID is undefined, cannot generate bulletin.');
    }
  }



}
