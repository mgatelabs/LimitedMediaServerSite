import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessDetailDialogComponent } from './process-detail-dialog.component';

describe('ProcessDetailDialogComponent', () => {
  let component: ProcessDetailDialogComponent;
  let fixture: ComponentFixture<ProcessDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessDetailDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
