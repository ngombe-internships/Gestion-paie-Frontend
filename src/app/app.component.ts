import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from "./toast/toast.component";
import { DocumentViewerModalComponent } from "./shared/components/document-viewer-modal/document-viewer-modal.component";
import { HeaderComponent } from "./components/header/header.component";
import { FloatingNotificationsComponent } from "./conges/components/floating-notifications/floating-notifications.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, ToastComponent, DocumentViewerModalComponent, FloatingNotificationsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  template:'<router-outlet></router-outlet>'
})
export class AppComponent {
  title = 'maalipo';
}
