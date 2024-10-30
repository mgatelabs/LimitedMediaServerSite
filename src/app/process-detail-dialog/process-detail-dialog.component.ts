import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LogData, ProcessService, StatusData } from '../process.service';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';

/**
 * Dialog version of Process-Details
 */
@Component({
  selector: 'app-process-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, DecimalPipe, MatIconModule],
  templateUrl: './process-detail-dialog.component.html',
  styleUrl: './process-detail-dialog.component.css'
})
export class ProcessDetailDialogComponent implements OnDestroy {

  task_id: number = -1;
  task_data: StatusData = {
    description: "",
    failure: false,
    finished: false,
    id: -1,
    log: [],
    name: "",
    progress: 0,
    percent: 0,
    waiting: false,
    warning: false,
    worked: false
  };

  canManage: boolean = false;

  constructor(
    private authService: AuthService,
    public dialogRef: MatDialogRef<ProcessDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task_id: number },
    public processService: ProcessService
  ) { }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.task_id = this.data.task_id;
    this.refreshData();

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  refreshData() {
    this.processService.singleProcessStatus(this.task_id)
      .pipe(first())
      .subscribe(data => {
        this.task_data = data;
      });
  }

  cancelTask() {
    this.processService.cancelProcessStatus(this.task_id)
      .pipe(first())
      .subscribe(data => {
        this.refreshData();
      });
  }

  promoteTask() {
    this.processService.promoteProcessTask(this.task_id)
      .pipe(first())
      .subscribe(data => {
        this.refreshData();
      });
  }

  isRunning() {
    return this.task_id > 0 && !this.task_data.finished;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
