import { Component, Inject, computed, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogModule } from '@angular/material/dialog';

import {
  MediaSearchDialogData,
  MediaSearchDialogResult,
  MediaSortOrder
} from './media-search-dialog.types';
import { MediaFolderTag } from '../media-folder-tag.service';
import { MatFormField, MatLabel, MatHint } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatSelect, MatOption } from "@angular/material/select";
import { MatCard, MatCardContent } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-media-search-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MatInputModule, MatDialogModule, MatDialogContent, MatFormField, MatLabel, MatIcon, MatSelect, MatOption, MatHint, MatCard, MatDialogActions, MatCardContent, MatButtonModule, TranslocoDirective],
  templateUrl: './media-search-dialog.component.html',
  styleUrl: './media-search-dialog.component.css'
})
export class MediaSearchDialogComponent {
  // For filtering tags in the UI
  tagFilter = new FormControl<string>('', { nonNullable: true });

  // Form
  form = new FormGroup({
    text: new FormControl<string>('', { nonNullable: true }),
    tagBitsPositive: new FormControl<number[]>([], { nonNullable: true }),
    tagBitsNegative: new FormControl<number[]>([], { nonNullable: true }),
    sortOrder: new FormControl<string>('AZ', { nonNullable: true }),
    blurLevel: new FormControl<number>(0, { nonNullable: true }),
    filterLevel: new FormControl<number>(0, { nonNullable: true }),
  });

  // Sorting dropdown
  sortOptions: Array<{ value: MediaSortOrder; label: string }> = [
    { value: 'AZ', label: 'form.sort_az' },
    { value: 'ZA', label: 'form.sort_za' },
    { value: 'DA', label: 'form.sort_da' },
    { value: 'DD', label: 'form.sort_dd' },
    { value: 'FA', label: 'form.sort_sa' },
    { value: 'FD', label: 'form.sort_sd' },
  ];

  // Keep tags in a signal for cheap derived filtering
  availableTagsSig = signal<MediaFolderTag[]>([]);

  filteredTags = computed(() => {
    const filter = this.tagFilter.value?.trim().toLowerCase() ?? '';
    const tags = this.availableTagsSig();

    if (!filter) return tags;

    return tags.filter(t =>
      t.short.toLowerCase().includes(filter) ||
      t.long.toLowerCase().includes(filter) ||
      (t.description ?? '').toLowerCase().includes(filter) ||
      `${t.bit}`.includes(filter)
    );
  });

  blurLevels: Array<{ value: number; label: string }> = [];
  filterLevels: Array<{ value: number; label: string }> = [];

  constructor(
    private dialogRef: MatDialogRef<MediaSearchDialogComponent, MediaSearchDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: MediaSearchDialogData
  ) {
    // Load inputs
    this.availableTagsSig.set(data.availableTags ?? []);
    this.blurLevels = data.blurLevels ?? [];
    this.filterLevels = data.filterLevels ?? [];

    // Apply initial values (optional)
    if (data.initial) {
      this.form.patchValue({
        text: data.initial.text ?? '',
        tagBitsPositive: data.initial.tagBitsPositive ?? [],
        tagBitsNegative: data.initial.tagBitsNegative ?? [],
        sortOrder: data.initial.sortOrder ?? 'AZ',
        blurLevel: data.initial.blurLevel ?? (this.blurLevels?.[0]?.value ?? 0),
        filterLevel: data.initial.filterLevel ?? (this.filterLevels?.[0]?.value ?? 0),
      });
    } else {
      // Default blur level if nothing provided
      if (this.blurLevels.length > 0) {
        this.form.patchValue({ blurLevel: this.blurLevels[0].value });
      }
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  apply(): void {
    const value = this.form.getRawValue();

    // Optional: build a 128-bit mask as BigInt (serialized as string)
    // If your bits are 0..127, use 1n << BigInt(bit)
    // If your bits are 1..128, use 1n << BigInt(bit - 1)

    this.dialogRef.close({
      text: value.text,
      tagBitsPositive: value.tagBitsPositive,
      tagBitsNegative: value.tagBitsNegative,
      sortOrder: value.sortOrder,
      blurLevel: value.blurLevel,
      filterLevel: value.filterLevel
    });
  }

  clearTags(): void {
    this.form.controls.tagBitsPositive.setValue([]);
    this.form.controls.tagBitsNegative.setValue([]);
  }
}
