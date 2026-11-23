import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { SplitPositionPickerComponent } from '../split-position-picker/split-position-picker.component';

@Component({
  selector: 'app-image-multi-splitter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatButton, MatIconButton, MatIconModule, TranslocoDirective, SplitPositionPickerComponent],
  templateUrl: './image-multi-splitter.component.html',
  styleUrl: './image-multi-splitter.component.css'
})
export class ImageMultiSplitterComponent implements AfterViewInit {

  @Input() imageUrl!: string;
  @Output() splitConfirmed = new EventEmitter<{ success: boolean; isHorizontal: boolean; positions: number[] }>();

  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('scrollMaster') scrollMaster!: ElementRef;
  @ViewChild('previewImage') previewImage!: ElementRef<HTMLImageElement>;

  isHorizontal: boolean = true;
  splitCount: number = 1;
  positions: number[] = [];
  activeIndex: number = 0;
  maxPosition: number = 100;
  crossSize: number = 100;

  pickerVisible = false;
  pickerAnchorX = 0;
  pickerAnchorY = 0;

  readonly MIN_SPLITS = 1;
  readonly MAX_SPLITS = 10;

  ngAfterViewInit(): void {
    this.imageElement.nativeElement.onload = () => {
      this.onImageLoad();
    };
  }

  onImageLoad(): void {
    const { width, height } = this.imageElement.nativeElement;
    this.maxPosition = this.isHorizontal ? height : width;
    this.crossSize = this.isHorizontal ? width : height;
    this.rebuildPositions();
    this.updatePreview();
  }

  onOrientationChange(): void {
    const img = this.imageElement.nativeElement;
    this.maxPosition = this.isHorizontal ? img.height : img.width;
    this.crossSize = this.isHorizontal ? img.width : img.height;
    this.rebuildPositions();
    this.updatePreview();
  }

  adjustSplitCount(delta: number): void {
    const next = Math.min(this.MAX_SPLITS, Math.max(this.MIN_SPLITS, this.splitCount + delta));
    if (next !== this.splitCount) {
      const adding = next > this.splitCount;
      this.splitCount = next;
      this.rebuildPositions();
      if (adding) {
        this.activeIndex = this.positions.length - 1;
      }
      this.updatePreview();
    }
  }

  rebuildPositions(): void {
    const prev = this.positions;
    if (this.splitCount > prev.length && prev.length > 0) {
      // Adding one cut: place it after the last existing one, midway to end
      const last = prev[prev.length - 1];
      const newPos = Math.round((last + this.maxPosition) / 2);
      this.positions = [...prev, newPos];
    } else {
      // Removing or initialising: distribute evenly, preserve existing values where possible
      const newPositions: number[] = [];
      for (let i = 0; i < this.splitCount; i++) {
        const defaultVal = Math.round((this.maxPosition / (this.splitCount + 1)) * (i + 1));
        newPositions.push(prev[i] ?? defaultVal);
      }
      this.positions = newPositions;
    }
    this.validatePositions();
    if (this.activeIndex >= this.positions.length) {
      this.activeIndex = this.positions.length - 1;
    }
  }

  validatePositions(): void {
    const GAP = 1;
    for (let i = 1; i < this.positions.length; i++) {
      if (this.positions[i] <= this.positions[i - 1]) {
        this.positions[i] = this.positions[i - 1] + GAP;
      }
    }
    for (let i = this.positions.length - 2; i >= 0; i--) {
      if (this.positions[i] >= this.positions[i + 1]) {
        this.positions[i] = this.positions[i + 1] - GAP;
      }
    }
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] = Math.max(1, Math.min(this.maxPosition - 1, this.positions[i]));
    }
  }

  nudge(index: number, delta: number): void {
    const min = index === 0 ? 1 : this.positions[index - 1] + 1;
    const max = index === this.positions.length - 1
      ? this.maxPosition - 1
      : this.positions[index + 1] - 1;
    const next = Math.min(max, Math.max(min, this.positions[index] + delta));
    if (next !== this.positions[index]) {
      this.positions[index] = next;
      this.activeIndex = index;
      this.updatePreview();
    }
  }

  onImageClick(event: MouseEvent): void {
    const img = this.imageElement.nativeElement;
    const rect = img.getBoundingClientRect();
    const rawPos = this.isHorizontal
      ? Math.round(event.clientY - rect.top)
      : Math.round(event.clientX - rect.left);
    const clamped = Math.max(1, Math.min(this.maxPosition - 1, rawPos));

    const min = this.activeIndex === 0 ? 1 : this.positions[this.activeIndex - 1] + 1;
    const max = this.activeIndex === this.positions.length - 1
      ? this.maxPosition - 1
      : this.positions[this.activeIndex + 1] - 1;

    this.positions[this.activeIndex] = Math.max(min, Math.min(max, clamped));
    this.validatePositions();
    this.updatePreview();

    this.pickerAnchorX = event.clientX;
    this.pickerAnchorY = event.clientY;
    this.pickerVisible = true;
  }

  onPickerPositionSelected(event: { position: number; crossPosition: number }): void {
    const min = this.activeIndex === 0 ? 1 : this.positions[this.activeIndex - 1] + 1;
    const max = this.activeIndex === this.positions.length - 1
      ? this.maxPosition - 1
      : this.positions[this.activeIndex + 1] - 1;
    this.positions[this.activeIndex] = Math.max(min, Math.min(max, event.position));
    this.validatePositions();
    this.updatePreview();
  }

  onPickerDismissed(): void {
    this.pickerVisible = false;
  }

  setActive(index: number): void {
    this.activeIndex = index;
    this.updatePreview();
  }

  isValid(): boolean {
    if (this.positions.length < 1 || this.positions.length > 10) return false;
    for (let i = 0; i < this.positions.length; i++) {
      if (this.positions[i] < 1 || this.positions[i] >= this.maxPosition) return false;
      if (i > 0 && this.positions[i] <= this.positions[i - 1]) return false;
    }
    return true;
  }

  updatePreview(): void {
    if (!this.previewImage || this.positions.length === 0) return;

    const zoom = 8;
    const viewportSize = 200;
    const pos = this.positions[this.activeIndex] ?? this.positions[0];
    const img = this.imageElement.nativeElement;

    let offsetX = 0;
    let offsetY = 0;

    if (this.isHorizontal) {
      offsetY = (pos * zoom) - (viewportSize / 2);
      offsetX = ((img.width / 2) * zoom) - (viewportSize / 2);
    } else {
      offsetX = (pos * zoom) - (viewportSize / 2);
      offsetY = ((img.height / 2) * zoom) - (viewportSize / 2);
    }

    this.previewImage.nativeElement.style.transform =
      `scale(${zoom}) translate(${-offsetX / zoom}px, ${-offsetY / zoom}px)`;

    const line = this.previewImage.nativeElement
      .closest('.preview-container')
      ?.querySelector('.preview-line');
    if (line) {
      line.classList.toggle('horizontal', this.isHorizontal);
      line.classList.toggle('vertical', !this.isHorizontal);
    }
  }

  confirmSplit(): void {
    if (!this.isValid()) return;
    this.splitConfirmed.emit({ success: true, isHorizontal: this.isHorizontal, positions: [...this.positions] });
  }

  cancelSplit(): void {
    this.splitConfirmed.emit({ success: false, isHorizontal: this.isHorizontal, positions: [] });
  }
}
