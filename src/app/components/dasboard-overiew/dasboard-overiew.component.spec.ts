import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DasboardOveriewComponent } from './dasboard-overiew.component';

describe('DasboardOveriewComponent', () => {
  let component: DasboardOveriewComponent;
  let fixture: ComponentFixture<DasboardOveriewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DasboardOveriewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DasboardOveriewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
