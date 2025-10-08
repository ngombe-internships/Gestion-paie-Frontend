import { TestBed } from '@angular/core/testing';

import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditLogsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
