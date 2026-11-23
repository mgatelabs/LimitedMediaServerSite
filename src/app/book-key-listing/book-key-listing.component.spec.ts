import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookKeyListingComponent } from './book-key-listing.component';

describe('BookKeyListingComponent', () => {
  let component: BookKeyListingComponent;
  let fixture: ComponentFixture<BookKeyListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookKeyListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookKeyListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
