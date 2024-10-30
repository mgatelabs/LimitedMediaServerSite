import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupEntryComponent } from './group-entry.component';

describe('GroupEntryComponent', () => {
  let component: GroupEntryComponent;
  let fixture: ComponentFixture<GroupEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
