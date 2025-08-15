import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CongesSoldesComponent } from './conges-soldes.component';

describe('CongesSoldesComponent', () => {
  let component: CongesSoldesComponent;
  let fixture: ComponentFixture<CongesSoldesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CongesSoldesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CongesSoldesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
