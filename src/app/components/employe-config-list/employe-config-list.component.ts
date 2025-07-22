import { Component, inject, OnInit } from '@angular/core';
import { EmployePaieConfig } from '../../model/employeConfig';
import { Employe } from '../../model/employe';
import { ElementPaie } from '../../model/elementpaie';
import { EmployePaieConfigService } from '../../services/employe-paie-config.service';
import { EmployeService } from '../../services/employe.service';
import { ElementpaieService } from '../../services/elementpaie.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employe-config-list',
  imports: [FormsModule,CommonModule],
  templateUrl: './employe-config-list.component.html',
  styleUrl: './employe-config-list.component.css'
})
export class EmployeConfigListComponent  implements OnInit{

  configs: EmployePaieConfig[] = [];
  allEmployes: Employe[] = [];
  allElementPaies: ElementPaie[] = [];
  isLoading = true;
  error: string | null = null;


  searchTerm = '';
  filterEmployeId: number | null = null;
  filterElementPaieId: number | null = null;
  filterStatus: 'active' | 'all' = 'active';

  //pagination
  currentPage = 1;
  itemsPerpage = 5;


   private readonly employePaieConfigService = inject(EmployePaieConfigService);
    private readonly employeService = inject(EmployeService);
    private readonly elementpaieService = inject(ElementpaieService);
     private readonly router = inject(Router);
    private readonly toastrService = inject(ToastrService);
   private readonly dialog = inject ( MatDialog);

    trackByConfigId(index: number, config: EmployePaieConfig): number | undefined {
    return config.id;
  }


  ngOnInit(): void {
  this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

      forkJoin([
        this.employePaieConfigService.getEmployePaieConfigs(),
        this.employeService.getAllEmployes(),
        this.elementpaieService.getAll()
      ]) . subscribe ({
        next: ([configs,employes, elementPaies]) =>{

          this.configs = configs;
          this.allEmployes = employes;
          this.allElementPaies = elementPaies

          // Ajoutez ces logs pour déboguer
      console.log('Configs:', configs);
      console.log('Employes:', employes);
      console.log('ElementPaies:', elementPaies);

          this.isLoading = false
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement des données.';
          console.error('Error loading data:', err);
          this.isLoading = false;
        }
      })
  }

  getEmployeFullName(employeId: number): string {
      console.log('Recherche employeId', employeId, 'dans', this.allEmployes.map(e => e.id));
    const employe = this.allEmployes.find(emp => emp.id === employeId);
    return employe? `${employe.nom} ${employe.prenom} (${employe.matricule})` : 'N/A';
  }

  getElementPaieDesignation(elementPaieId: number): string {
    const element = this.allElementPaies.find(el => el.id === elementPaieId);
    return element ? `${element.designation} (${element.code})`: 'N/A';
  }

  get filteredConfigs(): EmployePaieConfig[]{
    let filtered = this.configs;

    if(this.filterEmployeId) {
      filtered = filtered.filter(config => config.employe === this.filterEmployeId)
    }

    if(this.filterElementPaieId){
      filtered = filtered.filter(config => config.elementPaie === this.filterElementPaieId);
    }

    if (this.filterStatus === 'active') {
      const today = new Date();

      filtered = filtered.filter(config => {
        const dateDebut = new Date(config.dateDebut);
        const dateFin = config.dateFin ? new Date(config.dateFin) : null;
        return dateDebut <= today && (!dateFin || dateFin >= today);
      });
    }

    if (this.searchTerm) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(config =>
        this.getEmployeFullName(config.employe).toLowerCase().includes(lowerCaseSearchTerm) ||
        this.getElementPaieDesignation(config.elementPaie).toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return filtered;
  }

  get paginatedConfigs(): EmployePaieConfig[]{
    const startIndex = (this.currentPage - 1) * this.itemsPerpage;
    return this.filteredConfigs.slice(startIndex, startIndex + this.itemsPerpage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredConfigs.length / this.itemsPerpage);
  }

  changePage (pageNumber: number): void {
    if(pageNumber >=1 && pageNumber <= this.totalPages){
      this.currentPage = pageNumber;
    }
  }

   onNewConfig(): void {
    this.router.navigate(['/dashboard/employe-paie-config/new']);
  }

  onEditConfig(id: number | undefined): void {
    if (id) {
      this.router.navigate([`/dashboard/employe-paie-config/edit/${id}`]);
    }
  }

  onDeleteConfig(id: number | undefined): void {
  if (!id) return;

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      title: 'Confirmation de suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette configuration ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    }
  });

  dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.employePaieConfigService.deleteEmployePaieConfig(id).subscribe({
        next: () => {
          this.toastrService.success('Configuration supprimée avec succès !');
          this.loadData();
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression de la configuration.';
          this.toastrService.error(
            'Une erreur est survenue lors de la suppression',
            'Erreur',
            { timeOut: 5000 }
          );

          // Optionnel : logger l'erreur dans un service de logging
          // this.errorLoggingService.logError('DeleteConfigError', err);
        }
      });
    }
  });
}

  getElementPaieFormula(elementPaieId: number): string {
  const element = this.allElementPaies.find(el => el.id === elementPaieId);
  return element?.formuleCalcul || '';
}

}
