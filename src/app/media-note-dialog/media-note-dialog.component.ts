import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface MediaNoteDialogData {
  folder_id: string;
}

@Component({
  selector: 'app-media-note-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './media-note-dialog.component.html',
  styleUrl: './media-note-dialog.component.css'
})
export class MediaNoteDialogComponent {

  folder_id: string;
  note_text: string = '';

  constructor(
    public dialogRef: MatDialogRef<MediaNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaNoteDialogData
  ) {
    this.folder_id = data.folder_id;
  }

  onSubmit(): void {
    if (!this.note_text.trim()) return;
    this.dialogRef.close(this.note_text);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
