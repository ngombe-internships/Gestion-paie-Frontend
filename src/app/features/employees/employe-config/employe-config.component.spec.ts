import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeConfigComponent } from './employe-config.component';

describe('EmployeConfigComponent', () => {
  let component: EmployeConfigComponent;
  let fixture: ComponentFixture<EmployeConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
