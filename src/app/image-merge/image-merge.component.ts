import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-merge',
  standalone: true,
  imports: [CommonModule, MatButton, MatIconButton, MatIconModule],
  templateUrl: './image-merge.component.html',
  styleUrl: './image-merge.component.css'
})
export class ImageMergeComponent {

  @Input() imageUrl!: string;
  @Input() imageUrl2!: string;
  @Output() mergeConfirmed = new EventEmitter<{ success: boolean; isHorizontal: boolean }>();

  isHorizontal: boolean = false;

  confirmMerge(): void {
    this.mergeConfirmed.emit({
      success: true,
      isHorizontal: this.isHorizontal
    });
  }

  cancelMerge(): void {
    this.mergeConfirmed.emit({
      success: false,
      isHorizontal: this.isHorizontal
    });
  }

}
