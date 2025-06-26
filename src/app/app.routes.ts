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

export const routes: Routes = [
  {path: 'login', component: LoginComponent},

   {
    path: 'dashboard',
    component: DasboardComponent,
    canActivate: [authGuard],
    children:[

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
    ]
   },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
