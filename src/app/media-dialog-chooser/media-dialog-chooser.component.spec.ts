import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaDialogChooserComponent } from './media-dialog-chooser.component';

describe('MediaDialogChooserComponent', () => {
  let component: MediaDialogChooserComponent;
  let fixture: ComponentFixture<MediaDialogChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaDialogChooserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaDialogChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
