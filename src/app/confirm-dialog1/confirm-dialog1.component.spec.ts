import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialog1Component } from './confirm-dialog1.component';

describe('ConfirmDialog1Component', () => {
  let component: ConfirmDialog1Component;
  let fixture: ComponentFixture<ConfirmDialog1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
