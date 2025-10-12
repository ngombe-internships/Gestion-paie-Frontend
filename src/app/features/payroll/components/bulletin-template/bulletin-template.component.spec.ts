import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulletinTemplateComponent } from './bulletin-template.component';

describe('BulletinTemplateComponent', () => {
  let component: BulletinTemplateComponent;
  let fixture: ComponentFixture<BulletinTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulletinTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulletinTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
