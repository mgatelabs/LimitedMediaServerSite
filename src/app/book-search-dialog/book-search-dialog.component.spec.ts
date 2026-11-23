import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { BookSearchDialogComponent } from './book-search-dialog.component';
import { BookSearchDialogData, BookSearchDialogResult } from './book-search-dialog.types';

describe('BookSearchDialogComponent', () => {
  let component: BookSearchDialogComponent;
  let fixture: ComponentFixture<BookSearchDialogComponent>;
  let dialogRef: MatDialogRef<BookSearchDialogComponent, BookSearchDialogResult>;
  let input: HTMLInputElement;

  const dialogData: BookSearchDialogData = {
    availableTags: ['tag-a', 'tag-b'],
    processors: [{ value: 'p1', name: 'Processor 1' }],
    sortOptions: [
      { value: 'AZ', label: 'sort.AZ' },
      { value: 'ZA', label: 'sort.ZA' },
    ],
    typeOptions: [
      { value: 'page', label: 'type.page' },
      { value: 'scrolling', label: 'type.scrolling' },
    ],
    blurLevels: [
      { value: 0, label: 'blur.0' },
      { value: 2, label: 'blur.2' },
    ],
    filterLevels: [
      { value: 0, label: 'filter.0' },
      { value: 1, label: 'filter.1' },
    ],
    initial: { text: 'hello' },
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        BookSearchDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              form: { tags: 'Tags', type_filter: 'Type filter', processors: 'Processors' },
            },
          },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    input = fixture.nativeElement.querySelector('input[placeholder="Title, filename, etc."]');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should focus the search text and select its contents when the dialog opens', async () => {
    // The focus is deferred to a macrotask by the component, so let it run.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('hello');
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('hello'.length);
  });

  it('should not re-select the search text on subsequent focus', async () => {
    // Let the initial focus + pre-selection happen first.
    await new Promise(resolve => setTimeout(resolve, 0));

    // Simulate the user moving the caret, then the dialog's focus trap
    // re-focusing the input. The pre-selection must happen only once.
    input.setSelectionRange(2, 2);
    input.blur();
    input.focus();

    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);
  });

  it('should apply the search (like the Confirm button) when the form is submitted via Enter', () => {
    const form = fixture.nativeElement.querySelector('form');

    // Simulates pressing Enter in a text box: the browser performs implicit
    // submission, which Angular surfaces as `ngSubmit` -> apply() — the same
    // method the visible Confirm button calls.
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledWith({
      text: 'hello',
      tags: [],
      processors: [],
      type: '',
      sortOrder: 'AZ',
      blurLevel: 0,
      filterLevel: 0,
    });
  });

  it('should close the dialog without a value when cancel is clicked', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const cancel = buttons.find(b => b.textContent?.trim() === 'Cancel');

    cancel!.click();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    // Cancel must not pass a result to the caller.
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
