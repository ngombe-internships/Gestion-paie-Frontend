import { Component } from '@angular/core';
import { Routes } from '@angular/router';

// Components imports - Authentication
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { RegisterEmployerComponent } from './components/register-employeur/register-employer.component';
import { PasswordResetComponent } from './features/auth/password-reset/password-reset.component';
import { PasswordForgotComponent } from './features/auth/password-forgot/password-forgot.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';

// Components imports - Dashboard
import { DasboardComponent } from './components/dasboard/dasboard.component';
import { DasboardOveriewComponent } from './features/dashboard/dasboard-overiew/dasboard-overiew.component';
import { EmployeurDasboardComponent } from './features/employees/employeur-dasboard/employeur-dasboard.component';

// Components imports - Employés
import { EmployeListComponent } from './features/employees/employe-list/employe-list.component';
import { EmployeFormComponent } from './features/employees/employe-form/employe-form.component';
import { EmployeDetailsComponent } from './features/employees/employe-detail/employe-detail.component';

// Components imports - Bulletins
import { BulletinFormComponent } from './components/bulletin-form/bulletin-form.component';
import { BulletinListComponent } from './components/bulletin-list/bulletin-list.component';
import { BulletinDetailComponent } from './components/bulletin-detail/bulletin-detail.component';
import { EmployeeBulletinListComponent } from './features/employees/employee-bulletin-list/employee-bulletin-list.component';
import { BulletinTemplateComponent } from './components/bulletin-template/bulletin-template.component';

// Components imports - Entreprise
import { EntrepriseDetailsComponent } from './components/entreprise-details/entreprise-details.component';
import { EntrepriseFormComponent } from './features/company/entreprise-form/entreprise-form.component';
import { EntrepriseParametreRhListComponent } from './features/company/entreprise-parametre-rh-list/entreprise-parametre-rh-list.component';

// Components imports - Configuration & Paie
import { ElementPaieListComponent } from './components/element-paie-list/element-paie-list.component';
import { EmployeConfigListComponent } from './features/employees/employe-config-list/employe-config-list.component';
import { EmployeConfigComponent } from './features/employees/employe-config/employe-config.component';

// Components imports - Administration
import { EmployeurListComponent } from './features/employees/employeur-list/employeur-list.component';
import { AuditLogsComponent } from './features/auditing/audit-logs/audit-logs.component';

// Guards
import { authGuard } from './guard/auth.guard';
import { adminGuard } from './guard/admin.guard';
import { noAuthGuard } from './guard/noAuth.guard';
import { CongesSoldesComponent } from './features/leave/conges-soldes/conges-soldes.component';
import { CongesDemandesComponent } from './features/leave/conges-demandes/conges-demandes.component';
import { CongesCalendrierComponent } from './features/leave/conges-calendrier/conges-calendrier.component';
import { MesCongesComponent } from './features/leave/mes-conges/mes-conges.component';
import { MonSoldeComponent } from './features/leave/mon-solde/mon-solde.component';
import { NouvelleDemandeComponent } from './features/leave/nouvelle-demande/nouvelle-demande.component';
import { JoursFeriesComponent } from './features/leave/jours-feries/jours-feries.component';
import { TypeConge } from './features/leave/models/demande-conge.model';
import { TypesCongesComponent } from './features/leave/types-conges/types-conges.component';
import { NotificationsHistoriqueComponent } from './conges/components/notifications-historique/notifications-historique.component';

export const routes: Routes = [
  // === ROUTES PUBLIQUES ===
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'reset-password/:token', component: PasswordResetComponent, canActivate: [noAuthGuard] },
  { path: 'forgot-password', component: PasswordForgotComponent, canActivate: [noAuthGuard] },

  // === DASHBOARD PRINCIPAL ===
  {
    path: 'dashboard',
    component: DasboardComponent,
    canActivate: [authGuard],
    children: [
      // --- Overview ---
      { path: 'overview', component: DasboardOveriewComponent, canActivate: [authGuard] },
      { path: 'dashEmployeur', component: EmployeurDasboardComponent, canActivate: [authGuard] },

      // --- Inscription & Profil ---
      { path: 'register/employer-company', component: RegisterEmployerComponent },
      { path: 'register/employer-company/:id', component: RegisterEmployerComponent },
      { path: 'register/employer', component: RegisterComponent },
      { path: 'mon-profil', component: EmployeDetailsComponent, canActivate: [authGuard] },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },

      // --- Gestion Employés ---
      { path: 'employes', component: EmployeListComponent, canActivate: [authGuard] },
      { path: 'employes/create', component: EmployeFormComponent, canActivate: [authGuard] },
      { path: 'employes/edit/:id', component: EmployeFormComponent, canActivate: [authGuard] },
      { path: 'employes/:id', component: EmployeDetailsComponent, canActivate: [authGuard] },

      // --- Gestion Bulletins ---
      { path: 'bulletins', component: BulletinFormComponent, canActivate: [authGuard] },
      { path: 'bulletins/employeur', component: BulletinListComponent, canActivate: [authGuard] },
      { path: 'bulletins/:id', component: BulletinDetailComponent, canActivate: [authGuard] },
      { path: 'employeBulletin', component: EmployeeBulletinListComponent, canActivate: [authGuard] },
      { path: 'template', component: BulletinTemplateComponent, canActivate: [authGuard] },

      // --- Gestion Entreprise ---
      { path: 'entrepriseDetail/:id', component: EntrepriseDetailsComponent, canActivate: [authGuard] },
      { path: 'entrepriseDetail', component: EntrepriseDetailsComponent, canActivate: [authGuard] },
      { path: 'entreprise/edit', component: EntrepriseFormComponent, canActivate: [authGuard] },
      { path: 'parametres', component: EntrepriseParametreRhListComponent, canActivate: [authGuard] },

      // --- Configuration Paie ---
      { path: 'element', component: ElementPaieListComponent, canActivate: [authGuard] },
      { path: 'employe-paie-config', component: EmployeConfigListComponent, canActivate: [authGuard] },
      { path: 'employe-paie-config/new', component: EmployeConfigComponent, canActivate: [authGuard] },
      { path: 'employe-paie-config/edit/:id', component: EmployeConfigComponent, canActivate: [authGuard] },

      // === CONGÉS ===
       { path: 'conges/demandes', component: CongesDemandesComponent ,canActivate:[authGuard]},
       { path: 'conges/calendrier', component: CongesCalendrierComponent ,canActivate:[authGuard]},
      { path: 'conges/types', component: TypesCongesComponent,canActivate:[authGuard] },
       { path: 'conges/soldes', component: CongesSoldesComponent,canActivate:[authGuard] },
       { path: 'conges/jours-feries', component: JoursFeriesComponent,canActivate:[authGuard] },


      // === CONGÉS EMPLOYÉ ===
      {path: 'conges/mes-demandes', component: MesCongesComponent, canActivate: [authGuard] },
      {path:'conges/mon-solde', component: MonSoldeComponent, canActivate: [authGuard] },
      {path:'conges/nouvelle-demande', component: NouvelleDemandeComponent, canActivate: [authGuard] },

      // === NOTIFICATIONS ===
      { path: 'notifications', component: NotificationsHistoriqueComponent, canActivate: [authGuard] },

      // --- Administration ---
      { path: 'employeur', component: EmployeurListComponent, canActivate: [authGuard] },
      { path: 'audit-logs', component: AuditLogsComponent, canActivate: [authGuard] }
    ]
  },
  // === REDIRECTIONS ===
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
