import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEntryComponent } from './user-entry.component';

describe('UserEntryComponent', () => {
  let component: UserEntryComponent;
  let fixture: ComponentFixture<UserEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
