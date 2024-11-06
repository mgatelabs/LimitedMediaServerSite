import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessInfoCardComponent } from './process-info-card.component';

describe('ProcessInfoCardComponent', () => {
  let component: ProcessInfoCardComponent;
  let fixture: ComponentFixture<ProcessInfoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessInfoCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
