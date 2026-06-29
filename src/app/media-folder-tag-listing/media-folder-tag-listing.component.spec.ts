import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaFolderTagListingComponent } from './media-folder-tag-listing.component';

describe('MediaFolderTagListingComponent', () => {
  let component: MediaFolderTagListingComponent;
  let fixture: ComponentFixture<MediaFolderTagListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaFolderTagListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaFolderTagListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
