import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardSessionEntryComponent } from './hard-session-entry.component';

describe('HardSessionEntryComponent', () => {
  let component: HardSessionEntryComponent;
  let fixture: ComponentFixture<HardSessionEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardSessionEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HardSessionEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
