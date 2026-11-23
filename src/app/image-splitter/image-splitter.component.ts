import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, Renderer2, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { SplitPositionPickerComponent } from '../split-position-picker/split-position-picker.component';

@Component({
  selector: 'app-image-splitter',
  templateUrl: './image-splitter.component.html',
  imports: [CommonModule, MatInputModule, MatFormFieldModule, FormsModule, MatCheckboxModule, MatButton, MatIconButton, MatSliderModule, MatIconModule, SplitPositionPickerComponent],
  styleUrls: ['./image-splitter.component.css'],
  standalone: true
})
export class ImageSplitterComponent implements AfterViewInit {
  @Input() imageUrl!: string;
  @Output() splitConfirmed = new EventEmitter<{ success: boolean, isHorizontal: boolean; keepFirst: boolean; splitPosition: number }>();
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('backImageElement') backImageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('scrollMaster') scrollMaster!: ElementRef;
  @ViewChild('previewImage') previewImage!: ElementRef<HTMLImageElement>;

  isHorizontal: boolean = true;
  @Input() keepFirst: boolean = true;
  splitPosition: number = 50;
  crossPosition: number = -1; // -1 = use image midpoint until picker sets it
  maxPosition: number = 100;
  crossSize: number = 100;

  pickerVisible = false;
  pickerAnchorX = 0;
  pickerAnchorY = 0;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    this.imageElement.nativeElement.onload = () => {
      this.updateMaxPosition();
      this.setSplitPosition();
    };
  }

  onSplitOptionChange(): void {
    this.crossPosition = -1;
    this.updateMaxPosition();
    this.setSplitPosition();
  }

  updateMaxPosition(): void {
    const { width, height } = this.imageElement.nativeElement;
    this.maxPosition = this.isHorizontal ? height : width;
    this.crossSize = this.isHorizontal ? width : height;
    if (this.splitPosition > this.maxPosition) {
      this.splitPosition = this.maxPosition / 2;
    }
  }

  onSliderChange(event: Event): void {
    this.splitPosition = (event.target as HTMLInputElement).valueAsNumber;
    this.setSplitPosition();
  }

  calculateRect(position: number, first: boolean, horizonal: boolean): string {
    if (horizonal) {
      const dimension = `${position}px`;
      const otherDimension = 'auto';
      return first
        ? `rect(0  auto  ${dimension}  ${otherDimension})`
        : `rect(${dimension} auto  auto  ${otherDimension})`;
    } else {
      const dimension = `${position}px`;
      const otherDimension = 'auto';
      return first
        ? `rect(0 ${dimension} auto auto)`
        : `rect(0 auto auto ${dimension})`;
    }
  }

  setSplitPosition(): void {
    let left = '0';
    let top = '0';
    const dimension = this.isHorizontal ? `${this.splitPosition}px` : `auto`;
    const otherDimension = this.isHorizontal ? 'auto' : `${this.splitPosition}px`;

    //const clipRect = this.keepFirst
    //  ? `rect(0  auto  ${dimension}  ${otherDimension})`
    //  : `rect(${dimension} auto  auto  ${otherDimension})`; 

    //const clipRect2 = !this.keepFirst
    //  ? `rect(0  auto  ${dimension}  ${otherDimension})`
    //  : `rect(${dimension} auto  auto  ${otherDimension})`;

    const clipRect = this.calculateRect(this.splitPosition, this.keepFirst, this.isHorizontal);
    const clipRect2 = this.calculateRect(this.splitPosition, !this.keepFirst, this.isHorizontal);


    if (!this.keepFirst) {
      if (this.isHorizontal) {
        let temp = this.splitPosition * -1;
        if (!this.keepFirst) {
          temp += 100;
        }
        top = temp + 'px';
      } else {


        let temp = this.splitPosition * -1;
        if (!this.keepFirst) {
          temp += 100;
        }
        left = temp + 'px';
      }
    }

    this.renderer.setStyle(this.imageElement.nativeElement, 'clip-path', clipRect);
    this.renderer.setStyle(this.imageElement.nativeElement, 'margin-left', left);
    this.renderer.setStyle(this.imageElement.nativeElement, 'margin-top', top);

    this.renderer.setStyle(this.backImageElement.nativeElement, 'clip-path', clipRect2);
    this.renderer.setStyle(this.backImageElement.nativeElement, 'margin-left', left);
    this.renderer.setStyle(this.backImageElement.nativeElement, 'margin-top', top);

    if (this.keepFirst && this.isHorizontal) {
      const elementHeight = this.scrollMaster.nativeElement.offsetHeight;
      let halfHeight = elementHeight / 2;

      let pos = this.splitPosition - halfHeight;
      if (pos < 0) {
        pos = 0;
      }
      this.scrollMaster.nativeElement.scrollTop = pos;
    } else if (this.keepFirst && !this.isHorizontal) {
      const elementWidth = this.scrollMaster.nativeElement.offsetWidth;
      let halfWidth = elementWidth / 2;

      let pos = this.splitPosition - halfWidth;
      if (pos < 0) {
        pos = 0;
      }
      this.scrollMaster.nativeElement.scrollLeft = pos;
    }

    this.updatePreview();
  }

  updatePreview(): void {
    if (!this.previewImage) return;

    const zoom = 8;

    const img = this.imageElement.nativeElement;
    const preview = this.previewImage.nativeElement;

    const viewportSize = 200; // matches CSS

    let offsetX = 0;
    let offsetY = 0;

    if (this.isHorizontal) {
      offsetY = (this.splitPosition * zoom) - (viewportSize / 2);
      const crossCenter = this.crossPosition >= 0 ? this.crossPosition : img.width / 2;
      offsetX = (crossCenter * zoom) - (viewportSize / 2);
    } else {
      offsetX = (this.splitPosition * zoom) - (viewportSize / 2);
      const crossCenter = this.crossPosition >= 0 ? this.crossPosition : img.height / 2;
      offsetY = (crossCenter * zoom) - (viewportSize / 2);
    }

    preview.style.transform = `scale(${zoom}) translate(${-offsetX / zoom}px, ${-offsetY / zoom}px)`;

    const line = document.querySelector('.preview-line');

    if (line) {
      line.classList.toggle('horizontal', this.isHorizontal);
      line.classList.toggle('vertical', !this.isHorizontal);
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

  nudge(delta: number) {
    const min = 1;
    const max = this.maxPosition;

    const next = Math.min(max, Math.max(min, this.splitPosition + delta));
    if (next !== this.splitPosition) {
      this.splitPosition = next;
      this.setSplitPosition();
    }
  }

  onImageClick(event: MouseEvent): void {
    const img = this.imageElement.nativeElement;
    const rect = img.getBoundingClientRect();
    const rawPos = this.isHorizontal
      ? Math.round(event.clientY - rect.top)
      : Math.round(event.clientX - rect.left);
    const next = Math.max(1, Math.min(this.maxPosition - 1, rawPos));
    if (next !== this.splitPosition) {
      this.splitPosition = next;
      this.setSplitPosition();
    }
    this.pickerAnchorX = event.clientX;
    this.pickerAnchorY = event.clientY;
    this.pickerVisible = true;
  }

  onPickerPositionSelected(event: { position: number; crossPosition: number }): void {
    const next = Math.max(1, Math.min(this.maxPosition - 1, event.position));
    this.crossPosition = event.crossPosition;
    if (next !== this.splitPosition) {
      this.splitPosition = next;
      this.setSplitPosition();
    } else {
      this.updatePreview();
    }
  }

  onPickerDismissed(): void {
    this.pickerVisible = false;
  }
}
