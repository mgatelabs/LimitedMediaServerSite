import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardSessionListingComponent } from './hard-session-listing.component';

describe('HardSessionListingComponent', () => {
  let component: HardSessionListingComponent;
  let fixture: ComponentFixture<HardSessionListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardSessionListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HardSessionListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
