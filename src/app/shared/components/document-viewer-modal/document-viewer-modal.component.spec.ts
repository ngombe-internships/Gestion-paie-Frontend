import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentViewerModalComponent } from './document-viewer-modal.component';

describe('DocumentViewerModalComponent', () => {
  let component: DocumentViewerModalComponent;
  let fixture: ComponentFixture<DocumentViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentViewerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
