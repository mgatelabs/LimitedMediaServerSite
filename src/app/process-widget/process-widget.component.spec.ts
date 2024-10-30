import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessWidgetComponent } from './process-widget.component';

describe('ProcessWidgetComponent', () => {
  let component: ProcessWidgetComponent;
  let fixture: ComponentFixture<ProcessWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
