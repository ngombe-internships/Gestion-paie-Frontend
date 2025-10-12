import { Component, inject, OnInit } from '@angular/core';
import { EmployeService } from '../../services/employe.service';
import { Router } from '@angular/router';
import { catchError, count, map, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecentLogsComponent } from "../../../auth/components/recent-logs/recent-logs.component";
import { BulletinService } from '../../../payroll/services/bulletin.service';

@Component({
  selector: 'app-employeru-dasboard',
  imports: [RecentLogsComponent],
  templateUrl: './employeru-dasboard.component.html',
  styleUrl: './employeru-dasboard.component.css'
})
export class EmployeurDasboardComponent implements OnInit {


  numberOfEmployees: number | null = null;
  numberOfBulletins: number | null = null;
  isLoadingEmployees: boolean = true;
  isLoadingBulletins: boolean = true;
  errorMessage: string | null = null;

   private readonly employeService = inject (EmployeService);
   private readonly bulletinService = inject (BulletinService);
  private readonly router = inject (Router);

 ngOnInit(): void {
    this.getBulletin();
    this.getEmploye();
  }

  getBulletin(): void {
    this.isLoadingBulletins = true;

    this.bulletinService.getBulletinCountForEmployer().pipe(
      map(response => response.data),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la recuperation des metrique du tableau de bord Bulletin.', error);

        this.errorMessage = error.error?.message || 'Impossible de charger les metrique du tableau de bord Bulletin.';
        this.isLoadingBulletins= false;
        return of (null);
      })
    ).subscribe(count => {
        this.isLoadingBulletins = false;
        if(count!== null ){
          this.numberOfBulletins = count;
        }
      })
  }

   getEmploye(): void {
    this.isLoadingEmployees = true;
    this.errorMessage= null;
    this.employeService.getEmployeurCountForEmployer().pipe(
      map(response => response.data),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la recuperation des metrique du tableau de bord Employe.', error);

        this.errorMessage = error.error?.message || 'Impossible de charger les metrique du tableau de bord Employe.';
        this.isLoadingEmployees= false;
        return of (null);
      })
    ).subscribe(count=> {
        this.isLoadingEmployees = false;
        if(count !== null){
          this.numberOfEmployees = count;
        }
      })
  }

}
