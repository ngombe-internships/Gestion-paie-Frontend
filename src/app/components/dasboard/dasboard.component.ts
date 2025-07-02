import { Router, RouterModule } from '@angular/router';
import { routes } from './../../app.routes';
import { AuthService } from './../../services/auth.service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dasboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DasboardComponent implements OnInit {

  displayName: string | null = null;
  userRole: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private subscriptions = new Subscription();
  constructor() {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.userRole$.subscribe(role => {
        this.userRole = role;
        console.log('User Role updated (via Subject):', this.userRole);
      this.handleInitalDashboardRedirect();
      })
    );

    this.subscriptions.add(
      this.authService.displayName$.subscribe(name => {
        this.displayName = name;
        console.log('Display Name updated (via Subject):', this.displayName);
      })
    );

    if (this.displayName === null) {
      this.displayName = this.authService.getDisplayName();
    }
    if (this.userRole === null) {
      this.userRole = this.authService.getUserRole();
    }

    console.log('Dashboard initial load (ngOnInit end) - Name:', this.displayName, 'Role:', this.userRole);
   setTimeout(() => {
      this.handleInitalDashboardRedirect();
    }, 0);
  }




  // pour la redirection
  handleInitalDashboardRedirect(): void{

    if (this.userRole && this.router.url === '/dashboard') {
      if(this.userRole == 'ADMIN') {
        this.router.navigate(['/dashboard/overview'])
      }
      else  if(this.userRole == 'EMPLOYE') {
        this.router.navigate(['/dashboard/employeBulletin']);

      } else if (this.userRole === 'EMPLOYEUR' || this.userRole === 'ADMIN'){
              this.router.navigate(['/dashboard/dashEmployeur']);
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
