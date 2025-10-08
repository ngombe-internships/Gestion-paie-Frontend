import { TestBed } from '@angular/core/testing';

import { BulletinTemplateService } from './bulletin-template.service';

describe('BulletinTemplateService', () => {
  let service: BulletinTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BulletinTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
