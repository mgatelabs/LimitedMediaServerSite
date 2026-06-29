import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessLogCardComponent } from './process-log-card.component';

describe('ProcessLogCardComponent', () => {
  let component: ProcessLogCardComponent;
  let fixture: ComponentFixture<ProcessLogCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessLogCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessLogCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
