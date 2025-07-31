import { Component, OnInit, inject } from '@angular/core';
import { AuditLog, AuditLogsService } from '../services/audit-logs.service';
import { CommonModule } from '@angular/common';

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
}
