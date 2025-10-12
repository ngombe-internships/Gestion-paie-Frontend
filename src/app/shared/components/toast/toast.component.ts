import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
 private toastService = inject(ToastService);
  toasts: Toast[] = [];

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  closeToast(id: string) {
    this.toastService.remove(id);
  }
}
