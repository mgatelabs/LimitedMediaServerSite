import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageMergeComponent } from './image-merge.component';

describe('ImageMergeComponent', () => {
  let component: ImageMergeComponent;
  let fixture: ComponentFixture<ImageMergeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageMergeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageMergeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
