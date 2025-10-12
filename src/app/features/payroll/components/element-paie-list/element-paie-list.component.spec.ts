import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementPaieListComponent } from './element-paie-list.component';

describe('ElementPaieListComponent', () => {
  let component: ElementPaieListComponent;
  let fixture: ComponentFixture<ElementPaieListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementPaieListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElementPaieListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
