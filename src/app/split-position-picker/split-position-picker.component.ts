import {
  Component, ElementRef, EventEmitter, HostListener, Input,
  OnInit, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const GRID = 13;
const VIEWPORT_PX = 350;
const PANEL_W = 388;
const PANEL_H = 525;

const INITIAL_ZOOM = 2;

interface HistoryEntry {
  start: number; end: number; position: number;
  crossStart: number; crossEnd: number; crossPosition: number;
}

interface Cell {
  row: number; col: number;
  splitStart: number; splitEnd: number; splitCenter: number;
  crossStart: number; crossEnd: number; crossCenter: number;
}

@Component({
  selector: 'app-split-position-picker',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './split-position-picker.component.html',
  styleUrl: './split-position-picker.component.css'
})
export class SplitPositionPickerComponent implements OnInit {

  @Input() imageUrl!: string;
  @Input() isHorizontal!: boolean;
  @Input() imageNaturalSize!: number;
  @Input() imageNaturalCross!: number;
  @Input() initialPosition!: number;
  @Input() anchorX!: number;
  @Input() anchorY!: number;

  @Output() positionSelected = new EventEmitter<{ position: number; crossPosition: number }>();
  @Output() dismissed = new EventEmitter<void>();

  viewStart = 0;
  viewEnd = 100;
  crossStart = 0;
  crossEnd = 100;
  currentPosition = 50;
  currentCrossPosition = 50;
  hoveredCell: string | null = null;
  history: HistoryEntry[] = [];

  floatLeft = 0;
  floatTop = 0;

  private _ignoreNextDocClick = true;

  ngOnInit(): void {
    this.currentPosition = this.initialPosition;
    this.currentCrossPosition = this.imageNaturalCross / 2;

    const viewRange = VIEWPORT_PX / INITIAL_ZOOM;
    const halfRange = viewRange / 2;
    this.viewStart = Math.max(0, this.initialPosition - halfRange);
    this.viewEnd = this.viewStart + viewRange;
    if (this.viewEnd > this.imageNaturalSize) {
      this.viewEnd = this.imageNaturalSize;
      this.viewStart = Math.max(0, this.viewEnd - viewRange);
    }

    const crossRange = VIEWPORT_PX / INITIAL_ZOOM;
    const halfCross = crossRange / 2;
    this.crossStart = Math.max(0, this.currentCrossPosition - halfCross);
    this.crossEnd = this.crossStart + crossRange;
    if (this.crossEnd > this.imageNaturalCross) {
      this.crossEnd = this.imageNaturalCross;
      this.crossStart = Math.max(0, this.crossEnd - crossRange);
    }

    this.floatLeft = Math.min(this.anchorX + 10, window.innerWidth - PANEL_W - 8);
    this.floatTop = Math.min(this.anchorY + 10, window.innerHeight - PANEL_H - 8);
    if (this.floatLeft < 8) this.floatLeft = 8;
    if (this.floatTop < 8) this.floatTop = 8;
  }

  get cells(): Cell[] {
    const splitSize = (this.viewEnd - this.viewStart) / GRID;
    const crossSize = (this.crossEnd - this.crossStart) / GRID;
    const result: Cell[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        result.push({
          row, col,
          splitStart: this.viewStart + row * splitSize,
          splitEnd: this.viewStart + (row + 1) * splitSize,
          splitCenter: this.viewStart + (row + 0.5) * splitSize,
          crossStart: this.crossStart + col * crossSize,
          crossEnd: this.crossStart + (col + 1) * crossSize,
          crossCenter: this.crossStart + (col + 0.5) * crossSize,
        });
      }
    }
    return result;
  }

  cellKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  get splitLinePercent(): number {
    const range = this.viewEnd - this.viewStart;
    if (range <= 0) return 50;
    return ((this.currentPosition - this.viewStart) / range) * 100;
  }

  get crossLinePercent(): number {
    const range = this.crossEnd - this.crossStart;
    if (range <= 0) return 50;
    return ((this.currentCrossPosition - this.crossStart) / range) * 100;
  }

  get canDrillDown(): boolean {
    return (this.viewEnd - this.viewStart) >= GRID;
  }

  get zoomLevel(): number {
    const range = this.viewEnd - this.viewStart;
    if (range <= 0) return 1;
    return VIEWPORT_PX / range;
  }

  get imageStyle(): { [key: string]: string } {
    const splitRange = this.viewEnd - this.viewStart;
    const crossRange = this.crossEnd - this.crossStart;
    const splitScale = VIEWPORT_PX / splitRange;
    const crossScale = VIEWPORT_PX / crossRange;

    if (this.isHorizontal) {
      // split axis = Y (rows), cross axis = X (cols)
      const scaledHeight = this.imageNaturalSize * splitScale;
      const scaledWidth = this.imageNaturalCross * crossScale;
      const marginTop = -(this.viewStart * splitScale);
      const marginLeft = -(this.crossStart * crossScale);
      return {
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        marginTop: `${marginTop}px`,
        marginLeft: `${marginLeft}px`,
      };
    } else {
      // split axis = X (cols), cross axis = Y (rows)
      const scaledWidth = this.imageNaturalSize * splitScale;
      const scaledHeight = this.imageNaturalCross * crossScale;
      const marginLeft = -(this.viewStart * splitScale);
      const marginTop = -(this.crossStart * crossScale);
      return {
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        marginLeft: `${marginLeft}px`,
        marginTop: `${marginTop}px`,
      };
    }
  }

  clickCell(cell: Cell): void {
    this.history.push({
      start: this.viewStart, end: this.viewEnd, position: this.currentPosition,
      crossStart: this.crossStart, crossEnd: this.crossEnd, crossPosition: this.currentCrossPosition,
    });

    this.currentPosition = Math.round(cell.splitCenter);
    this.currentCrossPosition = Math.round(cell.crossCenter);
    this.positionSelected.emit({ position: this.currentPosition, crossPosition: this.currentCrossPosition });

    const splitRange = this.viewEnd - this.viewStart;
    const newSplitRange = splitRange / 2;
    if (newSplitRange >= 1) {
      const half = newSplitRange / 2;
      this.viewStart = Math.max(0, cell.splitCenter - half);
      this.viewEnd = this.viewStart + newSplitRange;
      if (this.viewEnd > this.imageNaturalSize) {
        this.viewEnd = this.imageNaturalSize;
        this.viewStart = Math.max(0, this.viewEnd - newSplitRange);
      }
    }

    const crossRange = this.crossEnd - this.crossStart;
    const newCrossRange = crossRange / 2;
    if (newCrossRange >= 1) {
      const half = newCrossRange / 2;
      this.crossStart = Math.max(0, cell.crossCenter - half);
      this.crossEnd = this.crossStart + newCrossRange;
      if (this.crossEnd > this.imageNaturalCross) {
        this.crossEnd = this.imageNaturalCross;
        this.crossStart = Math.max(0, this.crossEnd - newCrossRange);
      }
    }
  }

  goBack(): void {
    const prev = this.history.pop();
    if (prev) {
      this.viewStart = prev.start;
      this.viewEnd = prev.end;
      this.currentPosition = prev.position;
      this.crossStart = prev.crossStart;
      this.crossEnd = prev.crossEnd;
      this.currentCrossPosition = prev.crossPosition;
      this.positionSelected.emit({ position: this.currentPosition, crossPosition: this.currentCrossPosition });
    }
  }

  accept(): void {
    this.positionSelected.emit({ position: this.currentPosition, crossPosition: this.currentCrossPosition });
    this._ignoreNextDocClick = true;
    this.dismissed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this._ignoreNextDocClick = true;
    this.dismissed.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this._ignoreNextDocClick) {
      this._ignoreNextDocClick = false;
      return;
    }
    if (!this._el.nativeElement.contains(event.target as Node)) {
      this.dismissed.emit();
    }
  }

  constructor(private _el: ElementRef) {}
}
