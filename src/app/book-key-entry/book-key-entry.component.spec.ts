import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookKeyEntryComponent } from './book-key-entry.component';

describe('BookKeyEntryComponent', () => {
  let component: BookKeyEntryComponent;
  let fixture: ComponentFixture<BookKeyEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookKeyEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookKeyEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
