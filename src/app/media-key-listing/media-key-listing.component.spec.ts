import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaKeyListingComponent } from './media-key-listing.component';

describe('MediaKeyListingComponent', () => {
  let component: MediaKeyListingComponent;
  let fixture: ComponentFixture<MediaKeyListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaKeyListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaKeyListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
