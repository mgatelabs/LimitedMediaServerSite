import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterEditorComponent } from './chapter-editor.component';

describe('ChapterEditorComponent', () => {
  let component: ChapterEditorComponent;
  let fixture: ComponentFixture<ChapterEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChapterEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
