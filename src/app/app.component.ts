import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EmployeFormComponent } from "./employe/employe-form/employe-form.component";
import { EmployeListComponent } from "./employe/employe-list/employe-list.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink,RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  template:'<router-outlet></router-outlet>'
})
export class AppComponent {
  title = 'paie';
}
