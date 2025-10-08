import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audit-log-dialog',
  imports: [FormsModule, CommonModule],
  templateUrl: './audit-log-dialog.component.html',
  styleUrl: './audit-log-dialog.component.css'
})
export class AuditLogDialogComponent {
  from: string = '';
  to: string = '';
  dateRangeError: string = '';
  isExporting: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AuditLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  export() {
    // Validation des dates
    if (!this.from || !this.to) {
      this.dateRangeError = 'Veuillez sélectionner les dates de début et de fin.';
      return;
    }

    if (this.to < this.from) {
      this.dateRangeError = 'La date de fin doit être postérieure à la date de début.';
      return;
    }

    // Vérifier que la plage de dates n'est pas trop grande (ex: max 1 an)
    const fromDate = new Date(this.from);
    const toDate = new Date(this.to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      this.dateRangeError = 'La plage de dates ne peut pas dépasser 365 jours.';
      return;
    }

    this.dateRangeError = '';
    this.isExporting = true;

    this.dialogRef.close({
      from: this.from,
      to: this.to,
      isValid: true
    });
  }

  close() {
    this.dialogRef.close({ isValid: false });
  }
}
