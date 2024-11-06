import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessStatusCardComponent } from './process-status-card.component';

describe('ProcessStatusCardComponent', () => {
  let component: ProcessStatusCardComponent;
  let fixture: ComponentFixture<ProcessStatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessStatusCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
