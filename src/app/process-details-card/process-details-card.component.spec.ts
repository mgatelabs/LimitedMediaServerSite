import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessDetailsCardComponent } from './process-details-card.component';

describe('ProcessDetailsCardComponent', () => {
  let component: ProcessDetailsCardComponent;
  let fixture: ComponentFixture<ProcessDetailsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessDetailsCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
