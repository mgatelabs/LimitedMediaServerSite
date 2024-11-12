import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSplitterComponent } from './image-splitter.component';

describe('ImageSplitterComponent', () => {
  let component: ImageSplitterComponent;
  let fixture: ComponentFixture<ImageSplitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageSplitterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageSplitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
