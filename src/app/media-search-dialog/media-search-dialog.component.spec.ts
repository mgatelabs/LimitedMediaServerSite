import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaSearchDialogComponent } from './media-search-dialog.component';

describe('MediaSearchDialogComponent', () => {
  let component: MediaSearchDialogComponent;
  let fixture: ComponentFixture<MediaSearchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaSearchDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
