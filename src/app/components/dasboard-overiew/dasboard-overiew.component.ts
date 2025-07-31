import { Component, inject, OnInit } from '@angular/core';
import { DashboardMetric, DashboardService } from '../../services/dashboard.service';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecentLogsComponent } from "../../recent-logs/recent-logs.component";

@Component({
  selector: 'app-dasboard-overiew',
  imports: [RecentLogsComponent],
  templateUrl: './dasboard-overiew.component.html',
  styleUrl: './dasboard-overiew.component.css'
})
export class DasboardOveriewComponent implements OnInit {
  metrics: DashboardMetric | null = null;
  isLoading : boolean = true;
  errorMessage : string | null = null;
   private readonly dashboardService = inject (DashboardService);
  private readonly router = inject (Router);

  ngOnInit(): void {
    this.fetchDashboardMetric();
  }

  fetchDashboardMetric(): void {
    this.isLoading =true;
    this.errorMessage = null;
    this.dashboardService.getDashboardMetrics().pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la recuperation des metrique du tableau de bord.', error);

        this.errorMessage = error.error?.message || 'Impossible de charger les metrique du tableau de bord.';
        this.isLoading= false;
        return of (null);
      })

    ).subscribe (response => {
      this.isLoading= false;
      if(response && response.data){
        this.metrics = response.data;
      }
    })
      }



}
