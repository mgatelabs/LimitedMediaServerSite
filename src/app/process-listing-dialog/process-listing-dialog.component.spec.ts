import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessListingDialogComponent } from './process-listing-dialog.component';

describe('ProcessListingDialogComponent', () => {
  let component: ProcessListingDialogComponent;
  let fixture: ComponentFixture<ProcessListingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessListingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessListingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
