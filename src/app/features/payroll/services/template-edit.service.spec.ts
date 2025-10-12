import { TestBed } from '@angular/core/testing';

import { TemplateEditService } from './template-edit.service';

describe('TemplateEditService', () => {
  let service: TemplateEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
