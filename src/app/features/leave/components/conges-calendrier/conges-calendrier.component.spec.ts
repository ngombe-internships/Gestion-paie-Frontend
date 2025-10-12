import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CongesCalendrierComponent } from './conges-calendrier.component';

describe('CongesCalendrierComponent', () => {
  let component: CongesCalendrierComponent;
  let fixture: ComponentFixture<CongesCalendrierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CongesCalendrierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CongesCalendrierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
