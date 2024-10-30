import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageListingComponent } from './image-listing.component';

describe('ImageListingComponent', () => {
  let component: ImageListingComponent;
  let fixture: ComponentFixture<ImageListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
