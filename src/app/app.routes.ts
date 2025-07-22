import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { EmployeListComponent } from './employe/employe-list/employe-list.component';
import { BulletinFormComponent } from './components/bulletin-form/bulletin-form.component';
import { EmployeFormComponent } from './employe/employe-form/employe-form.component';
import { EmployeDetailsComponent } from './employe/employe-detail/employe-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guard/auth.guard';
import { RegisterEmployerComponent } from './components/register-employer/register-employer.component';
import { adminGuard } from './guard/admin.guard';
import { DasboardComponent } from './components/dasboard/dasboard.component';
import { BulletinListComponent } from './components/bulletin-list/bulletin-list.component';
import { BulletinDetailComponent } from './components/bulletin-detail/bulletin-detail.component';
import { EmployeeBulletinListComponent } from './components/employee-bulletin-list/employee-bulletin-list.component';
import { EmployeurListComponent } from './components/employeur-list/employeur-list.component';
import { EntrepriseDetailsComponent } from './components/entreprise-details/entreprise-details.component';
import { DasboardOveriewComponent } from './components/dasboard-overiew/dasboard-overiew.component';
import { EmployeurDasboardComponent } from './components/employeur-dasboard/employeur-dasboard.component';
import { BulletinTemplateComponent } from './components/bulletin-template/bulletin-template.component';
import { ElementPaieListComponent } from './components/element-paie-list/element-paie-list.component';
import { EmployeConfigListComponent } from './components/employe-config-list/employe-config-list.component';
import { EmployeConfigComponent } from './components/employe-config/employe-config.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},

   {
    path: 'dashboard',
    loadChildren: () => import('./components/dasboard/dasboard.module').then(m => m.DasboardModule),
    component: DasboardComponent,
    canActivate: [authGuard],
    children:[


      {path: 'overview', component: DasboardOveriewComponent, canActivate:[authGuard]},


     {path: 'register/employer-company', component: RegisterEmployerComponent },
     {path:'register/employer', component: RegisterComponent},
     { path: 'employes', component: EmployeListComponent, canActivate:[authGuard] },
     { path: 'employes/create', component :EmployeFormComponent, canActivate:[authGuard]},
     {path: 'employes/edit/:id', component : EmployeFormComponent, canActivate:[authGuard]},
     { path: 'mon-profil', component: EmployeDetailsComponent, canActivate:[authGuard]},
     {path: 'employes/:id', component: EmployeDetailsComponent, canActivate:[authGuard]},

     { path: 'bulletins', component: BulletinFormComponent, canActivate:[authGuard] },
     { path: 'bulletins/employeur', component: BulletinListComponent, canActivate: [authGuard]},
     { path: 'bulletins/:id', component: BulletinDetailComponent, canActivate: [authGuard]},


     {path:  'employeBulletin', component: EmployeeBulletinListComponent , canActivate: [authGuard]},
     {path: 'employeur', component:EmployeurListComponent, canActivate: [authGuard]},
     {path: 'entrepriseDetail/:id', component: EntrepriseDetailsComponent , canActivate:[authGuard]},
     {path: 'dashEmployeur', component:EmployeurDasboardComponent, canActivate:[authGuard]},


     {path: 'element',component:ElementPaieListComponent , canActivate:[authGuard] },
     {path:'template', component: BulletinTemplateComponent, canActivate:[authGuard]},

     { path: 'employe-paie-config', component: EmployeConfigListComponent, canActivate: [authGuard] },
      { path: 'employe-paie-config/new', component: EmployeConfigComponent, canActivate: [authGuard] },
      { path: 'employe-paie-config/edit/:id', component: EmployeConfigComponent, canActivate: [authGuard] },

    ]
   },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
