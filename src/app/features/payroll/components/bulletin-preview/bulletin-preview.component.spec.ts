import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulletinPreviewComponent } from './bulletin-preview.component';

describe('BulletinPreviewComponent', () => {
  let component: BulletinPreviewComponent;
  let fixture: ComponentFixture<BulletinPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulletinPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulletinPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
