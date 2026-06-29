import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { first, Subject, switchMap, takeUntil, timer } from 'rxjs';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProcessService, StatusData } from '../process.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

export interface ProcessStatusDialogData {
  task_id: number;
}

@Component({
  selector: 'app-quick-process-info',
  standalone: true,
  imports: [CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    RouterModule,
    TranslocoDirective,
    DecimalPipe,
    DragDropModule],
  templateUrl: './quick-process-info.component.html',
  styleUrl: './quick-process-info.component.css'
})
export class QuickProcessInfoComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  is_dialog = false;
  task_id!: number;
  task_data?: StatusData;

  private timer_running = false;
  private readonly poll_interval_ms = 2500;

  constructor(
    private readonly route: ActivatedRoute,
    public processService: ProcessService,
    private _snackBar: MatSnackBar,
    private readonly dialogRef: MatDialogRef<QuickProcessInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData?: ProcessStatusDialogData
  ) { }

  ngOnInit(): void {
    if (this.dialogData) {
      this.is_dialog = true;
      this.initFromData(this.dialogData);
    } else {
      this.is_dialog = false;
      this.initFromRoute();
    }
  }

  private initFromRoute(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.initFromData({
          task_id: Number(params['task_id'])
        });
      });
  }

  private initFromData(data: { task_id: number }): void {
    this.task_id = data.task_id;
    this.fetchOnce();
    this.startPolling();
  }

  // ---- Fetching --------------------------------------------------

  private fetchOnce(): void {
    this.processService.singleProcessStatus(this.task_id)
      .pipe(first())
      .subscribe({
        next: data => {
          this.task_data = data;

          if (this.task_data.finished && this.timer_running) {
            this.stopPolling();
          }
        },
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  private startPolling(): void {
    if (this.timer_running) {
      return;
    }

    this.timer_running = true;

    timer(0, this.poll_interval_ms)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.processService.singleProcessStatus(this.task_id)
        )
      )
      .subscribe({
        next: data => {
          this.task_data = data;

          if (this.task_data.finished) {
            this.stopPolling();
          }
        },
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.stopPolling();
        }
      });
  }

  private stopPolling(): void {
    this.timer_running = false;
  }

  // ---- Actions ---------------------------------------------------

  cancelTask(): void {
    if (!this.task_data || this.task_data.finished) {
      return;
    }

    // Example:
    // this.processService.cancelTask(this.task_id).subscribe();

    this.processService.cancelProcessStatus(this.task_id)
      .pipe(first())
      .subscribe({
        next: data => {
          if (this.is_dialog) {
            this.dialogRef.close(false);
          }
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });


  }

  close(): void {
    this.dialogRef.close(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
