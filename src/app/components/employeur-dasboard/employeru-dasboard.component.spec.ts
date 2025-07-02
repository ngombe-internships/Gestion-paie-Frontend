import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeruDasboardComponent } from './employeur-dasboard.component';

describe('EmployeruDasboardComponent', () => {
  let component: EmployeruDasboardComponent;
  let fixture: ComponentFixture<EmployeruDasboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeruDasboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeruDasboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
