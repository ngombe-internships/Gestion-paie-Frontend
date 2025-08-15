import { TestBed } from '@angular/core/testing';

import { DocumentViewerService } from './document-viewer.service';

describe('DocumentViewerService', () => {
  let service: DocumentViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
