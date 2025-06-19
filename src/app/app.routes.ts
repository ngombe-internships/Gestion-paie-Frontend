import { Routes } from '@angular/router';
import { EmployeListComponent } from './employe/employe-list/employe-list.component';
import { BulletinFormComponent } from './components/bulletin-form/bulletin-form.component';
import { EmployeFormComponent } from './employe/employe-form/employe-form.component';
import { EmployeDetailsComponent } from './employe/employe-detail/employe-detail.component';

export const routes: Routes = [
  { path: 'employes', component: EmployeListComponent },
  { path: 'employes/create', component :EmployeFormComponent},
  {path: 'employes/edit/:id', component : EmployeFormComponent},
  {path: 'employes/:id', component: EmployeDetailsComponent},

  { path: 'bulletins', component: BulletinFormComponent },
  { path: '', redirectTo: '/employes', pathMatch: 'full' },
  { path: '**', redirectTo: '/employes' }
];
