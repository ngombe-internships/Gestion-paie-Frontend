import { Component, inject, Pipe } from '@angular/core';
import { AuditLog, AuditLogsService } from '../services/audit-logs.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recent-logs',
  imports: [CommonModule,RouterLink],
  templateUrl: './recent-logs.component.html',
  styleUrl: './recent-logs.component.css'
})
export class RecentLogsComponent {

  logs: AuditLog[] = [];
  isLoading = true;
  private readonly auditLogService = inject (AuditLogsService);


   ngOnInit() {
    this.auditLogService.getAuditLogs({ page: 0, size: 5 }).subscribe({
      next: res => {
        this.logs = res.content;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }
}
