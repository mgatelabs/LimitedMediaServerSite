import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeNameComponent } from './node-name.component';

describe('NodeNameComponent', () => {
  let component: NodeNameComponent;
  let fixture: ComponentFixture<NodeNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeNameComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NodeNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
