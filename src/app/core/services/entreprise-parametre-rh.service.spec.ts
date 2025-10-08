import { TestBed } from '@angular/core/testing';

import { EntrepriseParametreRhService } from './entreprise-parametre-rh.service';

describe('EntrepriseParametreRhService', () => {
  let service: EntrepriseParametreRhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntrepriseParametreRhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
