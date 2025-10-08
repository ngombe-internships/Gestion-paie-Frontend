import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoursFeriesComponent } from './jours-feries.component';

describe('JoursFeriesComponent', () => {
  let component: JoursFeriesComponent;
  let fixture: ComponentFixture<JoursFeriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoursFeriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoursFeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
