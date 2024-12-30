import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerStatusComponent } from './server-status.component';

describe('ServerStatusComponent', () => {
  let component: ServerStatusComponent;
  let fixture: ComponentFixture<ServerStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServerStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
