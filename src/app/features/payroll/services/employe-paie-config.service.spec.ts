import { TestBed } from '@angular/core/testing';

import { EmployePaieConfigService } from './employe-paie-config.service';

describe('EmployePaieConfigService', () => {
  let service: EmployePaieConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployePaieConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
