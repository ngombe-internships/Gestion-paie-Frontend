import { TestBed } from '@angular/core/testing';

import { ElementpaieService } from './elementpaie.service';

describe('ElementpaieService', () => {
  let service: ElementpaieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElementpaieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
