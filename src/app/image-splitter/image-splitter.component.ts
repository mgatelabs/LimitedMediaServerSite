import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, Renderer2, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-image-splitter',
  templateUrl: './image-splitter.component.html',
  imports: [CommonModule, MatInputModule, MatFormFieldModule, FormsModule],
  styleUrls: ['./image-splitter.component.css'],
  standalone: true
})
export class ImageSplitterComponent implements AfterViewInit {
  @Input() imageUrl!: string;
  @Output() splitConfirmed = new EventEmitter<{ success: boolean, isHorizontal: boolean; keepFirst: boolean; splitPosition: number }>();
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('scrollMaster') scrollMaster!: ElementRef;

  isHorizontal: boolean = true;
  keepFirst: boolean = true;
  splitPosition: number = 50; // Percentage of the image height or width
  maxPosition: number = 100;  // Dynamic max value for the slider based on image dimensions

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    this.imageElement.nativeElement.onload = () => {
      this.updateMaxPosition();
      this.setSplitPosition();
    };
  }

  onSplitOptionChange(): void {
    this.updateMaxPosition();
    this.setSplitPosition();
  }

  updateMaxPosition(): void {
    // Set max position based on image dimensions and split orientation
    const { width, height } = this.imageElement.nativeElement;
    this.maxPosition = this.isHorizontal ? height : width;
    if (this.splitPosition > this.maxPosition) {
      this.splitPosition = this.maxPosition / 2; // Reset splitPosition within new bounds
    }
  }

  onSliderChange(event: Event): void {
    this.splitPosition = (event.target as HTMLInputElement).valueAsNumber;
    this.setSplitPosition();
  }

  setSplitPosition(): void {
    let left = '0';
    let top = '0';
    const dimension = this.isHorizontal ? `${this.splitPosition}px` : `auto`;
    const otherDimension = this.isHorizontal ? 'auto' : `${this.splitPosition}px`;
    const clipRect = this.keepFirst
      ? `rect(0  auto  ${dimension}  ${otherDimension})`
      : `rect(${dimension} auto  auto  ${otherDimension})`;

    if (!this.keepFirst) {
      if (this.isHorizontal) {
        top = '-' + this.splitPosition + 'px';
      } else {
        left = '-' + this.splitPosition + 'px';
      }
    }

    this.renderer.setStyle(this.imageElement.nativeElement, 'clip-path', clipRect);
    this.renderer.setStyle(this.imageElement.nativeElement, 'margin-left', left);
    this.renderer.setStyle(this.imageElement.nativeElement, 'margin-top', top);

    if (this.keepFirst) {
      const elementHeight = this.scrollMaster.nativeElement.offsetHeight;
      let halfHeight = elementHeight / 2;
      
      let pos = this.splitPosition - halfHeight;
      if (pos < 0) {
        pos = 0;
      }
      this.scrollMaster.nativeElement.scrollTop = pos;
    }

  }

  confirmSplit(): void {
    this.splitConfirmed.emit({
      success: true,
      isHorizontal: this.isHorizontal,
      keepFirst: this.keepFirst,
      splitPosition: this.splitPosition
    });
  }

  cancelSplit(): void {
    this.splitConfirmed.emit({
      success: false,
      isHorizontal: this.isHorizontal,
      keepFirst: this.keepFirst,
      splitPosition: this.splitPosition
    });
  }
}