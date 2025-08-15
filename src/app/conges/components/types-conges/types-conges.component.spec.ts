import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypesCongesComponent } from './types-conges.component';

describe('TypesCongesComponent', () => {
  let component: TypesCongesComponent;
  let fixture: ComponentFixture<TypesCongesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypesCongesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypesCongesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
