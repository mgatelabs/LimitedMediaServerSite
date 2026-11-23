import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaKeyEntryComponent } from './media-key-entry.component';

describe('MediaKeyEntryComponent', () => {
  let component: MediaKeyEntryComponent;
  let fixture: ComponentFixture<MediaKeyEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaKeyEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaKeyEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
