import { Component, OnInit, inject } from '@angular/core';
import { AuditLog, AuditLogsService } from '../services/audit-logs.service';
import { CommonModule } from '@angular/common';
import { AuditLogDialogComponent } from '../audit-log-dialog/audit-log-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-audit-logs',
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css'
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  isLoading = true;
  page = 0;
  size = 10;
  totalElements = 0;

  constructor() {}
  private readonly auditLogService= inject (AuditLogsService);
  private readonly dialog = inject(MatDialog);
  ngOnInit() {
    this.loadLogs();
  }

  loadLogs(page: number = 0) {
    this.isLoading = true;
    this.auditLogService.getAuditLogs({ page, size: this.size }).subscribe({
      next: res => {
        this.logs = res.content;
        this.page = res.number;
        this.totalElements = res.totalElements;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onPageChange(newPage: number) {
    this.loadLogs(newPage);
  }

  openExportDialog() {
    const dialogRef = this.dialog.open(AuditLogDialogComponent, {
      width: '400px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.from && result.to) {
        this.exportPdf(result.from, result.to);
      }
    });
  }

  exportPdf(from: string, to: string) {
    this.auditLogService.exportAuditLogsPdf(from, to).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${from}-to-${to}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.log('Erreur lors de l\'export PDF')
      }
    });
  }
}
