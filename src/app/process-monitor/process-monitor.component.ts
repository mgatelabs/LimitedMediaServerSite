import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProcessService, StatusData } from '../process.service';

@Component({
  selector: 'app-process-monitor',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, RouterModule,
    MatButtonModule, MatChipsModule, MatIconModule,
    MatProgressBarModule, TranslocoDirective
  ],
  templateUrl: './process-monitor.component.html',
  styleUrl: './process-monitor.component.css'
})
export class ProcessMonitorComponent implements OnInit, OnDestroy {

  @Input() task_id!: number;
  @Output() onSuccess = new EventEmitter<StatusData>();
  @Output() onFailure = new EventEmitter<StatusData>();

  task_data?: StatusData;
  elapsedSeconds = 0;

  private readonly destroy$ = new Subject<void>();
  private readonly elapsed$ = new Subject<void>();
  private readonly POLL_INTERVAL_MS = 2500;
  private startTime = 0;

  constructor(
    private readonly processService: ProcessService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startTime = Date.now();
    this.startElapsedTimer();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.elapsed$.next();
    this.elapsed$.complete();
  }

  private startElapsedTimer(): void {
    timer(0, 1000)
      .pipe(takeUntil(this.elapsed$))
      .subscribe(() => {
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        this.cdr.markForCheck();
      });
  }

  private startPolling(): void {
    timer(0, this.POLL_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.processService.singleProcessStatus(this.task_id))
      )
      .subscribe({
        next: data => {
          this.task_data = data;
          if (data.finished) {
            this.destroy$.next();
            this.elapsed$.next();
            if (data.failure) {
              this.onFailure.emit(data);
            } else {
              this.onSuccess.emit(data);
            }
          }
        },
        error: () => {
          this.destroy$.next();
          this.elapsed$.next();
          if (this.task_data) {
            this.onFailure.emit(this.task_data);
          }
        }
      });
  }

  get elapsedFormatted(): string {
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = this.elapsedSeconds % 60;
    return m > 0
      ? `${m}m ${s.toString().padStart(2, '0')}s`
      : `${s}s`;
  }

  get statusIcon(): string {
    if (!this.task_data) return 'hourglass_empty';
    if (this.task_data.failure) return 'error';
    if (this.task_data.warning) return 'warning';
    if (this.task_data.finished) return 'check_circle';
    if (this.task_data.waiting) return 'pending';
    return 'autorenew';
  }

  get statusLabel(): string {
    if (!this.task_data) return 'Starting...';
    if (this.task_data.failure) return 'Failed';
    if (this.task_data.warning) return 'Warning';
    if (this.task_data.finished) return 'Finished';
    if (this.task_data.waiting) return 'Waiting';
    return 'Running';
  }

  get statusColor(): string {
    if (!this.task_data) return '';
    if (this.task_data.failure) return 'warn';
    if (this.task_data.finished) return 'primary';
    return '';
  }

  get progressMode(): 'indeterminate' | 'determinate' {
    return !this.task_data || this.task_data.waiting ? 'indeterminate' : 'determinate';
  }
}
