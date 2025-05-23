import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaBrowserComponent } from './media-browser.component';

describe('MediaBrowserComponent', () => {
  let component: MediaBrowserComponent;
  let fixture: ComponentFixture<MediaBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaBrowserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
