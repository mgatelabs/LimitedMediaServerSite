import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginActionComponent } from './plugin-action.component';

describe('PluginActionComponent', () => {
  let component: PluginActionComponent;
  let fixture: ComponentFixture<PluginActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginActionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PluginActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
