import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyListingComponent } from './property-listing.component';

describe('PropertyListingComponent', () => {
  let component: PropertyListingComponent;
  let fixture: ComponentFixture<PropertyListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PropertyListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
