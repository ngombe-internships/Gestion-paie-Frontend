import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeConfigListComponent } from './employe-config-list.component';

describe('EmployeConfigListComponent', () => {
  let component: EmployeConfigListComponent;
  let fixture: ComponentFixture<EmployeConfigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeConfigListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
