import { TestBed } from '@angular/core/testing';

import { ConfirmDialog1Service } from './confirm-dialog1.service';

describe('ConfirmDialog1Service', () => {
  let service: ConfirmDialog1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialog1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
