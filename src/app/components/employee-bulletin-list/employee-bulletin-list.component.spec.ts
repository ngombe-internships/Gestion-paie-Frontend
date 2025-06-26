import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeBulletinListComponent } from './employee-bulletin-list.component';

describe('EmployeeBulletinListComponent', () => {
  let component: EmployeeBulletinListComponent;
  let fixture: ComponentFixture<EmployeeBulletinListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeBulletinListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeBulletinListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
