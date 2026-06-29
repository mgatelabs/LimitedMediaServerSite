import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaFolderTagChooserComponent } from './media-folder-tag-chooser.component';

describe('MediaFolderTagChooserComponent', () => {
  let component: MediaFolderTagChooserComponent;
  let fixture: ComponentFixture<MediaFolderTagChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaFolderTagChooserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaFolderTagChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
