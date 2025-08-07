import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from "./toast/toast.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  template:'<router-outlet></router-outlet>'
})
export class AppComponent {
  title = 'maalipo';
}
