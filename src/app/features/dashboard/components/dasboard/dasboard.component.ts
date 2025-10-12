// dasboard.component.ts - Version avec navigation accordéon
import { Router, RouterModule } from '@angular/router';
import { routes } from '../../../../app.routes';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../../../shared/components/layout/header/header.component';
import { AuthService } from '../../../../core/services/auth.service';

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-dasboard',
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DasboardComponent implements OnInit {

  displayName: string | null = null;
  userRole: string | null = null;
  isSidebarOpen = false;
  menuSections: MenuSection[] = [];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private subscriptions = new Subscription();

  constructor() {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.userRole$.subscribe(role => {
        this.userRole = role;
        this.initializeMenuByRole();
        this.handleInitalDashboardRedirect();
      })
    );

    this.subscriptions.add(
      this.authService.displayName$.subscribe(name => {
        this.displayName = name;
      })
    );

    if (this.displayName === null) {
      this.displayName = this.authService.getDisplayName();
    }
    if (this.userRole === null) {
      this.userRole = this.authService.getUserRole();
      this.initializeMenuByRole();
    }

    setTimeout(() => {
      this.handleInitalDashboardRedirect();
    }, 0);
  }

  initializeMenuByRole(): void {
    if (!this.userRole) return;

    switch (this.userRole) {
      case 'ADMIN':
        this.menuSections = this.getAdminMenu();
        break;
      case 'EMPLOYEUR':
        this.menuSections = this.getEmployeurMenu();
        break;
      case 'EMPLOYE':
        this.menuSections = this.getEmployeMenu();
        break;
    }
  }

  getAdminMenu(): MenuSection[] {
    return [
      {
        id: 'dashboard',
        title: 'Tableau de bord',
        icon: 'bi-bar-chart-fill',
        isExpanded: false,
        items: [
          { title: 'Vue d\'ensemble', route: '/dashboard/overview' }
        ]
      },
      {
        id: 'administration',
        title: 'Administration',
        icon: 'bi-gear-fill',
        isExpanded: false,
        items: [
          { title: 'Enregistrer un Employeur', route: '/dashboard/register/employer-company' },
          { title: 'Liste des employeurs', route: '/dashboard/employeur' },
          { title: 'Historique des activités', route: '/dashboard/audit-logs' }
        ]
      }
    ];
  }

  getEmployeurMenu(): MenuSection[] {
    return [
      {
        id: 'dashboard',
        title: 'Tableau de bord',
        icon: 'bi-bar-chart-fill',
        isExpanded: false,
        items: [
          { title: 'Vue d\'ensemble', route: '/dashboard/dashEmployeur' }
        ]
      },
      {
        id: 'rh',
        title: 'Gestion RH',
        icon: 'bi-people-fill',
        isExpanded: false,
        items: [
          { title: 'Mon Profil', route: '/dashboard/entrepriseDetail' },
          { title: 'Créer un Employé', route: '/dashboard/register/employer' },
          { title: 'Mes Employés', route: '/dashboard/employes' },
          { title: 'Bulletins des Employés', route: '/dashboard/bulletins/employeur' },
          { title: 'Config Employés', route: '/dashboard/employe-paie-config' }
        ]
      },
      {
        id: 'paie',
        title: 'Gestion Paie',
        icon: 'bi-currency-dollar',
        isExpanded: false,
        items: [
          { title: 'Éléments de paie', route: '/dashboard/element' },
          { title: 'Template Bulletin', route: '/dashboard/template' },
          { title: 'Paramètres des taux', route: '/dashboard/parametres' }
        ]
      },
      {
        id: 'conges',
        title: 'Gestion Congés',
        icon: 'bi-calendar-check',
        isExpanded: false,
        items: [
          { title: 'Demandes de congés', route: '/dashboard/conges/demandes' },
          { title: 'Calendrier', route: '/dashboard/conges/calendrier' },
          { title: 'Soldes employés', route: '/dashboard/conges/soldes' },
          { title: 'Jours fériés', route: '/dashboard/conges/jours-feries' },
          { title: 'Types de congés', route: '/dashboard/conges/types' },

        ]
      }
    ];
  }

  getEmployeMenu(): MenuSection[] {
    return [
      {
        id: 'profil',
        title: 'Mon Espace',
        icon: 'bi-person-fill',
        isExpanded: false,
        items: [
          { title: 'Mon Profil', route: '/dashboard/mon-profil' },
          { title: 'Mes Bulletins de Paie', route: '/dashboard/employeBulletin' },
          { title: 'Historique des activités', route: '/dashboard/audit-logs' }
        ]
      },
      {
        id: 'conges',
        title: 'Mes Congés',
        icon: 'bi-calendar-check',
        isExpanded: false,
        items: [
          { title: 'Mes demandes', route: '/dashboard/conges/mes-demandes' },
          { title: 'Mon solde', route: '/dashboard/conges/mon-solde' },
          { title: 'Nouvelle demande', route: '/dashboard/conges/nouvelle-demande' }
        ]
      }
    ];
  }

  toggleSection(sectionId: string): void {
    const section = this.menuSections.find(s => s.id === sectionId);
    if (section) {
      section.isExpanded = !section.isExpanded;

      // Fermer les autres sections si on en ouvre une nouvelle (optionnel)
      this.menuSections.forEach(s => {
        if (s.id !== sectionId) s.isExpanded = false;
      });
    }
  }

  handleInitalDashboardRedirect(): void {
    if (this.userRole && this.router.url === '/dashboard') {
      if (this.userRole == 'ADMIN') {
        this.router.navigate(['/dashboard/overview']);
      } else if (this.userRole == 'EMPLOYE') {
        this.router.navigate(['/dashboard/employeBulletin']);
      } else if (this.userRole === 'EMPLOYEUR' || this.userRole === 'ADMIN') {
        this.router.navigate(['/dashboard/dashEmployeur']);
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  onNavLinkClick() {
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.isSidebarOpen = false;
    }
  }
}
