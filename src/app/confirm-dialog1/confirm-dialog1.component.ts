import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog1',
  imports: [MatDialogModule,CommonModule],
  templateUrl: './confirm-dialog1.component.html',
  styleUrl: './confirm-dialog1.component.css'
})


export class ConfirmDialog1Component {
constructor(
    public dialogRef: MatDialogRef<ConfirmDialog1Component>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData // Utilisez l'interface ici
  ) {
    // Définir des valeurs par défaut si non fournies
    this.data.confirmButtonText = this.data.confirmButtonText || 'Confirmer';
    this.data.cancelButtonText = this.data.cancelButtonText || 'Annuler';
    this.data.buttonType = this.data.buttonType || 'primary'; // Type de bouton par défaut
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButtonText?: string; // Optionnel
  cancelButtonText?: string;  // Optionnel
  buttonType?: 'primary' | 'success' | 'danger' | 'warning' | 'info'; // Pour les classes CSS
}
