import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookBookmarkListingComponent } from './book-bookmark-listing.component';

describe('BookBookmarkListingComponent', () => {
  let component: BookBookmarkListingComponent;
  let fixture: ComponentFixture<BookBookmarkListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookBookmarkListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookBookmarkListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
