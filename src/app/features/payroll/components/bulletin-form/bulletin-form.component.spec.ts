import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulletinFormComponent } from './bulletin-form.component';

describe('BulletinFormComponent', () => {
  let component: BulletinFormComponent;
  let fixture: ComponentFixture<BulletinFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulletinFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulletinFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
