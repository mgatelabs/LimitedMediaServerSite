import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaFolderEntryComponent } from './media-folder-entry.component';

describe('MediaFolderEntryComponent', () => {
  let component: MediaFolderEntryComponent;
  let fixture: ComponentFixture<MediaFolderEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaFolderEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaFolderEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
