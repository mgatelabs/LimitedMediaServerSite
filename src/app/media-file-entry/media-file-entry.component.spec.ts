import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaFileEntryComponent } from './media-file-entry.component';

describe('MediaFileEntryComponent', () => {
  let component: MediaFileEntryComponent;
  let fixture: ComponentFixture<MediaFileEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaFileEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaFileEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
