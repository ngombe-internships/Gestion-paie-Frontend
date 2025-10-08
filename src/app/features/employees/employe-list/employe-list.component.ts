import { Component, inject, OnInit } from '@angular/core';
import { EmployeService } from '../../services/employe.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employe } from '../../../model/employe';

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

   // Pagination variables
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;



  private readonly employeService = inject (EmployeService);
  private readonly router = inject (Router);
  constructor (){}


  ngOnInit() : void{

    this.loadEmployes();
  }

  loadEmployes(): void {
    this.isLoading = true;
    this.errorMessage = null;
   this.employeService.getEmployesPaginated(this.currentPage, this.pageSize, this.searchText).subscribe({
      next: (response) => {
        this.employes = response.data.content;
        this.totalPages = response.data.totalPages;
        this.totalElements = response.data.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employes : ', error);
        this.errorMessage = 'Impossible de charger la liste des employes.';
        this.isLoading = false;
      }
    });
  }

  viewEmployeDetails (id: number | undefined) : void {
    if(id){
      this.router.navigate (['/dashboard/employes',id])
    }
  }

  editEmploye(id: number  | undefined) : void {
    if (id) {
      console.log('Navigation vers édition employé ID:', id);
      console.log('Route utilisée:', '/employes/edit/' + id);
      this.router.navigate(['/dashboard/employes/edit', id])
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
    this.router.navigate([`/dashboard/employes/create`]);
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

      this.router.navigate(['/dashboard/bulletins'], { queryParams: { employeId: employeId } });
    } else {
      console.error('Employee ID is undefined, cannot generate bulletin.');
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadEmployes();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadEmployes();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadEmployes();
  }

  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 0;
    this.loadEmployes();
  }




}
