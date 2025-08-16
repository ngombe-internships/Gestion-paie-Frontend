import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingNotificationsComponent } from './floating-notifications.component';

describe('FloatingNotificationsComponent', () => {
  let component: FloatingNotificationsComponent;
  let fixture: ComponentFixture<FloatingNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingNotificationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
