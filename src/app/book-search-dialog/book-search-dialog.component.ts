import { AfterViewInit, Component, ElementRef, Inject, ViewChild, computed, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatHint } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatSelect, MatOption } from "@angular/material/select";
import { MatRadioGroup, MatRadioButton } from "@angular/material/radio";
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { BookSearchDialogData, BookSearchDialogResult, ProcessorOption } from './book-search-dialog.types';

@Component({
  selector: 'app-book-search-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MatInputModule, MatDialogModule, MatDialogContent, MatFormField, MatLabel, MatIcon, MatSelect, MatOption, MatRadioGroup, MatRadioButton, MatHint, MatDialogActions, MatButtonModule, TranslocoDirective],
  templateUrl: './book-search-dialog.component.html',
  styleUrl: './book-search-dialog.component.css'
})
export class BookSearchDialogComponent implements AfterViewInit {
  // For filtering tags in the UI
  tagFilter = new FormControl<string>('', { nonNullable: true });

  // Reference to the search text input so it can be focused and pre-selected
  // when the dialog opens. Not `static: true` because the input lives inside the
  // *transloco embedded view, which is not present at the end of the first
  // change-detection pass when the ref is resolved statically.
  @ViewChild('searchText', { static: false })
  searchText!: ElementRef<HTMLInputElement>;

  // Set once the search text has been pre-selected on open, so we don't steal
  // the selection the user makes afterwards.
  private searchTextPreselected = false;

  // Form
  form = new FormGroup({
    text: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    processors: new FormControl<string[]>([], { nonNullable: true }),
    type: new FormControl<string>('' , { nonNullable: true }),
    sortOrder: new FormControl<string>('AZ', { nonNullable: true }),
    blurLevel: new FormControl<number>(0, { nonNullable: true }),
    filterLevel: new FormControl<number>(0, { nonNullable: true }),
  });

  // Options are driven by the caller so this dialog stays generic about labels/levels.
  sortOptions: Array<{ value: string; label: string }> = [];
  typeOptions: Array<{ value: string; label: string }> = [];
  blurLevels: Array<{ value: number; label: string }> = [];
  filterLevels: Array<{ value: number; label: string }> = [];

  // Keep tags in a signal for cheap derived filtering
  availableTagsSig = signal<string[]>([]);

  filteredTags = computed(() => {
    const filter = this.tagFilter.value?.trim().toLowerCase() ?? '';
    const tags = this.availableTagsSig();

    if (!filter) return tags;

    return tags.filter(t => t.toLowerCase().includes(filter));
  });

  // For filtering processors in the UI
  processorFilter = new FormControl<string>('', { nonNullable: true });

  // The processor list can arrive after the dialog opens (lazy fetch), so keep it
  // in a signal similar to availableTagsSig.
  availableProcessorsSig = signal<ProcessorOption[]>([]);

  filteredProcessors = computed(() => {
    const filter = this.processorFilter.value?.trim().toLowerCase() ?? '';
    const options = this.availableProcessorsSig();

    if (!filter) return options;

    return options.filter(p => p.name.toLowerCase().includes(filter));
  });

  constructor(
    private dialogRef: MatDialogRef<BookSearchDialogComponent, BookSearchDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: BookSearchDialogData
  ) {
    // Load inputs
    this.availableTagsSig.set(data.availableTags ?? []);
    this.availableProcessorsSig.set(data.processors ?? []);
    this.sortOptions = data.sortOptions ?? [];
    this.typeOptions = data.typeOptions ?? [];
    this.blurLevels = data.blurLevels ?? [];
    this.filterLevels = data.filterLevels ?? [];

    // Apply initial values (optional)
    if (data.initial) {
      this.form.patchValue({
        text: data.initial.text ?? '',
        tags: data.initial.tags ?? [],
        processors: data.initial.processors ?? [],
        type: data.initial.type ?? '',
        sortOrder: data.initial.sortOrder ?? 'AZ',
        blurLevel: data.initial.blurLevel ?? (this.blurLevels[0]?.value ?? 0),
        filterLevel: data.initial.filterLevel ?? (this.filterLevels[0]?.value ?? 0),
      });
    } else {
      // Default blur level if nothing provided
      if (this.blurLevels.length > 0) {
        this.form.patchValue({ blurLevel: this.blurLevels[0].value });
      }
    }
  }

  ngAfterViewInit(): void {
    // Move focus to the search text when the dialog opens so the user can
    // start typing right away. Deferred to a macrotask because focusing during
    // the current change-detection pass flips Material's `mat-focused` state
    // mid-pass, which triggers an ExpressionChangedAfterItHasBeenChecked error
    // in development mode.
    setTimeout(() => {
      this.searchText?.nativeElement?.focus();
    });
  }

  /**
   * Pre-select the search text so that typing immediately overwrites the
   * existing value. This runs on the (one-shot) focus event of the input, so
   * it also covers the dialog's own focus trap landing focus after the open
   * animation finishes.
   */
  onSearchTextFocus(): void {
    if (this.searchTextPreselected) {
      return;
    }
    this.searchTextPreselected = true;
    this.searchText.nativeElement?.select();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  apply(): void {
    const value = this.form.getRawValue();

    this.dialogRef.close({
      text: value.text,
      tags: value.tags,
      processors: value.processors,
      type: value.type,
      sortOrder: value.sortOrder,
      blurLevel: value.blurLevel,
      filterLevel: value.filterLevel
    });
  }

  clearTags(): void {
    this.form.controls.tags.setValue([]);
  }
}
