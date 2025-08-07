import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntrepriseParametreRhListComponent } from './entreprise-parametre-rh-list.component';

describe('EntrepriseParametreRhListComponent', () => {
  let component: EntrepriseParametreRhListComponent;
  let fixture: ComponentFixture<EntrepriseParametreRhListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntrepriseParametreRhListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntrepriseParametreRhListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
