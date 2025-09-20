// search-dialog.component.ts
import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,    
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css']
})
export class SearchDialogComponent {
  searchControl = new FormControl('');
  tagControl = new FormControl('');
  filteredTags$: Observable<string[]>;

  selectedTags: string[] = [];
  allTags: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { searchText?: string; selectedTags?: string[]; allTags?: string[] }
  ) {
    // Pre-populate if coming from previous search
    if (data.searchText) this.searchControl.setValue(data.searchText);
    if (data.selectedTags) this.selectedTags = [...data.selectedTags];
    if (data.allTags) this.allTags = [...data.allTags];

    this.filteredTags$ = this.tagControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  private _filterTags(value: string): string[] {
    const filterValue = (value || '').toLowerCase();
    return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue) && !this.selectedTags.includes(tag));
  }

  addTag(tag: string) {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.tagControl.setValue('');
    }
  }

  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  applySearch() {
    this.dialogRef.close({
      text: this.searchControl.value,
      tags: this.selectedTags
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
