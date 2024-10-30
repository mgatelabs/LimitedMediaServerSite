import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitForServerComponent } from './wait-for-server.component';

describe('WaitForServerComponent', () => {
  let component: WaitForServerComponent;
  let fixture: ComponentFixture<WaitForServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitForServerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WaitForServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
