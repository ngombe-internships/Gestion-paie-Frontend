import { Component, inject, OnInit } from '@angular/core';
import { EmployePaieConfig } from '../../model/employeConfig';
import { Employe } from '../../model/employe';
import { ElementPaie } from '../../model/elementpaie';
import { EmployePaieConfigService } from '../../services/employe-paie-config.service';
import { EmployeService } from '../../services/employe.service';
import { ElementpaieService } from '../../services/elementpaie.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employe-config-list',
  imports: [FormsModule,CommonModule],
  templateUrl: './employe-config-list.component.html',
  styleUrl: './employe-config-list.component.css'
})
export class EmployeConfigListComponent implements OnInit {
  configs: EmployePaieConfig[] = [];
  allEmployes: Employe[] = [];
  allElementPaies: ElementPaie[] = [];
  isLoading = true;
  error: string | null = null;


  searchTerm = '';
  filterEmployeId: number | null = null;
  filterElementPaieId: number | null = null;
  filterStatus: 'active' | 'all' = 'active';
  activeCount = 0;
  totalCount = 0;

  currentPage = 0;
  itemsPerPage = 10;

  totalPages = 0;
  totalElements = 0;

  private readonly employePaieConfigService = inject(EmployePaieConfigService);
  private readonly employeService = inject(EmployeService);
  private readonly elementpaieService = inject(ElementpaieService);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadEmployesAndElements();
    this.loadConfigs();
  }

  loadEmployesAndElements(): void {
    // Charge tous les employés et éléments de paie pour le filtrage
    this.employeService.getAllEmployesForRegister().subscribe({
      next: (employes) => this.allEmployes = employes,
      error: () => this.allEmployes = []
    });
    this.elementpaieService.getAll().subscribe({
      next: (elements) => this.allElementPaies = elements,
      error: () => this.allElementPaies = []
    });
  }

  loadConfigs(page: number = 1): void {
    this.isLoading = true;
    this.error = null;
    this.currentPage = page;

    this.employePaieConfigService.searchEmployePaieConfigs(
      this.filterEmployeId ?? undefined,
      this.filterElementPaieId ?? undefined,
      this.filterStatus,
      this.searchTerm,
      this.currentPage - 1,
      this.itemsPerPage
    ).subscribe({
      next: (response) => {
        this.configs = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des configurations.';
        this.isLoading = false;
      }
    });
  }

  trackByConfigId(index: number, config: EmployePaieConfig): number | undefined {
    return config.id;
  }

  getEmployeFullName(employeId: number): string {
    const employe = this.allEmployes.find(emp => emp.id === employeId);
    return employe ? `${employe.nom} ${employe.prenom} (${employe.matricule})` : 'N/A';
  }

  getElementPaieDesignation(elementPaieId: number): string {
    const element = this.allElementPaies.find(el => el.id === elementPaieId);
    return element ? `${element.designation} (${element.code})` : 'N/A';
  }

  getElementPaieFormula(elementPaieId: number): string {
    const element = this.allElementPaies.find(el => el.id === elementPaieId);
    return element?.formuleCalcul || '';
  }

  // Pagination
  changePage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.loadConfigs(pageNumber);
    }
  }

  // Filtrage et recherche
  onFiltersChange(): void {
    this.loadConfigs(1);
  }

  // Actions
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
            this.loadConfigs(this.currentPage);
          },
          error: () => {
            this.error = 'Erreur lors de la suppression de la configuration.';
            this.toastrService.error(
              'Une erreur est survenue lors de la suppression',
              'Erreur',
              { timeOut: 5000 }
            );
          }
        });
      }
    });
  }

}
