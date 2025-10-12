import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulletinListComponent } from './bulletin-list.component';

describe('BulletinListComponent', () => {
  let component: BulletinListComponent;
  let fixture: ComponentFixture<BulletinListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulletinListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulletinListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
