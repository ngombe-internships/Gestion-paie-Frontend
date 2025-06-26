import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,  CommonModule, ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  template:'<router-outlet></router-outlet>'
})
export class AppComponent {
  title = 'paie';
}
