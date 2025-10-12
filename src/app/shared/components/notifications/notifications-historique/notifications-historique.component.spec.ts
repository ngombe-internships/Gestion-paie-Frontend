import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsHistoriqueComponent } from './notifications-historique.component';

describe('NotificationsHistoriqueComponent', () => {
  let component: NotificationsHistoriqueComponent;
  let fixture: ComponentFixture<NotificationsHistoriqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsHistoriqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsHistoriqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
