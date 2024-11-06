import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentMediaWidgetComponent } from './recent-media-widget.component';

describe('RecentMediaWidgetComponent', () => {
  let component: RecentMediaWidgetComponent;
  let fixture: ComponentFixture<RecentMediaWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentMediaWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecentMediaWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
