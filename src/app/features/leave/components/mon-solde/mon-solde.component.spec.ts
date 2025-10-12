import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonSoldeComponent } from './mon-solde.component';

describe('MonSoldeComponent', () => {
  let component: MonSoldeComponent;
  let fixture: ComponentFixture<MonSoldeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonSoldeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonSoldeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
