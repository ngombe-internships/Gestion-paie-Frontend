import { TestBed } from '@angular/core/testing';

import { CalendrierCongeService } from './calendrier-conge.service';

describe('CalendrierCongeService', () => {
  let service: CalendrierCongeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalendrierCongeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
