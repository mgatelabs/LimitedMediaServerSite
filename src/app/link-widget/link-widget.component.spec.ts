import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkWidgetComponent } from './link-widget.component';

describe('LinkWidgetComponent', () => {
  let component: LinkWidgetComponent;
  let fixture: ComponentFixture<LinkWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LinkWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
