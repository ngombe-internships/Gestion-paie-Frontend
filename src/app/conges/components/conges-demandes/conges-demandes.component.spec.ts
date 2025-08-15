import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CongesDemandesComponent } from './conges-demandes.component';

describe('CongesDemandesComponent', () => {
  let component: CongesDemandesComponent;
  let fixture: ComponentFixture<CongesDemandesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CongesDemandesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CongesDemandesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
