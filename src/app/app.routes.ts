import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { noAuthGuard } from './core/guard/noAuth.guard';
import { PasswordResetComponent } from './features/auth/components/password-reset/password-reset.component';
import { PasswordForgotComponent } from './features/auth/components/password-forgot/password-forgot.component';
import { DasboardComponent } from './features/dashboard/components/dasboard/dasboard.component';
import { authGuard } from './core/guard/auth.guard';
import { DasboardOveriewComponent } from './features/dashboard/components/dasboard-overiew/dasboard-overiew.component';
import { EmployeurDasboardComponent } from './features/employees/components/employeur-dasboard/employeur-dasboard.component';
import { RegisterEmployerComponent } from './features/auth/components/register-employeur/register-employer.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { EmployeDetailsComponent } from './features/employees/components/employe-detail/employe-details.component';
import { ChangePasswordComponent } from './features/auth/components/change-password/change-password.component';
import { EmployeListComponent } from './features/employees/components/employe-list/employe-list.component';
import { EmployeFormComponent } from './features/employees/components/employe-form/employe-form.component';
import { BulletinFormComponent } from './features/payroll/components/bulletin-form/bulletin-form.component';
import { BulletinListComponent } from './features/payroll/components/bulletin-list/bulletin-list.component';
import { EmployeeBulletinListComponent } from './features/employees/components/employee-bulletin-list/employee-bulletin-list.component';
import { BulletinDetailComponent } from './features/payroll/components/bulletin-detail/bulletin-detail.component';
import { BulletinTemplateComponent } from './features/payroll/components/bulletin-template/bulletin-template.component';
import { EntrepriseDetailsComponent } from './features/company/components/entreprise-details/entreprise-details.component';
import { EntrepriseFormComponent } from './features/company/components/entreprise-form/entreprise-form.component';
import { EntrepriseParametreRhListComponent } from './features/company/components/entreprise-parametre-rh-list/entreprise-parametre-rh-list.component';
import { ElementPaieListComponent } from './features/payroll/components/element-paie-list/element-paie-list.component';
import { EmployeConfigListComponent } from './features/employees/components/employe-config-list/employe-config-list.component';
import { EmployeConfigComponent } from './features/employees/components/employe-config/employe-config.component';
import { CongesDemandesComponent } from './features/leave/components/conges-demandes/conges-demandes.component';
import { CongesCalendrierComponent } from './features/leave/components/conges-calendrier/conges-calendrier.component';
import { TypesCongesComponent } from './features/leave/components/types-conges/types-conges.component';
import { CongesSoldesComponent } from './features/leave/components/conges-soldes/conges-soldes.component';
import { JoursFeriesComponent } from './features/leave/components/jours-feries/jours-feries.component';
import { MesCongesComponent } from './features/leave/components/mes-conges/mes-conges.component';
import { MonSoldeComponent } from './features/leave/components/mon-solde/mon-solde.component';
import { NouvelleDemandeComponent } from './features/leave/components/nouvelle-demande/nouvelle-demande.component';
import { NotificationsHistoriqueComponent } from './shared/components/notifications/notifications-historique/notifications-historique.component';
import { EmployeurListComponent } from './features/employees/components/employeur-list/employeur-list.component';
import { AuditLogsComponent } from './features/auditing/components/audit-logs/audit-logs.component';



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
