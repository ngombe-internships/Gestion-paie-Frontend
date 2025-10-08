import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogDialogComponent } from './audit-log-dialog.component';

describe('AuditLogDialogComponent', () => {
  let component: AuditLogDialogComponent;
  let fixture: ComponentFixture<AuditLogDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
