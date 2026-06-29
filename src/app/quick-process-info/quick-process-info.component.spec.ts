import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickProcessInfoComponent } from './quick-process-info.component';

describe('QuickProcessInfoComponent', () => {
  let component: QuickProcessInfoComponent;
  let fixture: ComponentFixture<QuickProcessInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickProcessInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuickProcessInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
