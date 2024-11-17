import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-image-merge',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, FormsModule, MatButton],
  templateUrl: './image-merge.component.html',
  styleUrl: './image-merge.component.css'
})
export class ImageMergeComponent {

  @Input() imageUrl!: string;
  @Input() imageUrl2!: string;
  @Output() mergeConfirmed = new EventEmitter<{ success: boolean }>();

  confirmMerge(): void {
    this.mergeConfirmed.emit({
      success: true
    });
  }

  cancelMerge(): void {
    this.mergeConfirmed.emit({
      success: false
    });
  }

}
