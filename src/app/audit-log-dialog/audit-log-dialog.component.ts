import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-audit-log-dialog',
  imports: [FormsModule],
  templateUrl: './audit-log-dialog.component.html',
  styleUrl: './audit-log-dialog.component.css'
})
export class AuditLogDialogComponent {

   from: string = '';
   to: string = '';

   constructor(
    public dialogRef: MatDialogRef<AuditLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

   export() {
    this.dialogRef.close({ from: this.from, to: this.to });
  }

  close() {
    this.dialogRef.close();
  }

}
