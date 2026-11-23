import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-keyboard-shortcuts-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.css'
})
export class KeyboardShortcutsDialogComponent {
  constructor(public dialogRef: MatDialogRef<KeyboardShortcutsDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}
