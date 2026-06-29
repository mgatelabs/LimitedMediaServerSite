import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaFolderTagEntryComponent } from './media-folder-tag-entry.component';

describe('MediaFolderTagEntryComponent', () => {
  let component: MediaFolderTagEntryComponent;
  let fixture: ComponentFixture<MediaFolderTagEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaFolderTagEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaFolderTagEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
