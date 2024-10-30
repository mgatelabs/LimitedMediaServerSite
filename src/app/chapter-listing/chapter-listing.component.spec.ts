import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterListingComponent } from './chapter-listing.component';

describe('ChapterListingComponent', () => {
  let component: ChapterListingComponent;
  let fixture: ComponentFixture<ChapterListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChapterListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
