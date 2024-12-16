import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProcessService, StatusData } from '../process.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessInfoCardComponent } from "../process-info-card/process-info-card.component";
import { ProcessStatusCardComponent } from "../process-status-card/process-status-card.component";
import { ProcessDetailsCardComponent } from "../process-details-card/process-details-card.component";
import { TranslocoDirective } from '@jsverse/transloco';

/**
 * Dialog version of Process-Details
 */
@Component({
  selector: 'app-process-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatMenuModule, ProcessInfoCardComponent, ProcessStatusCardComponent, ProcessDetailsCardComponent, TranslocoDirective],
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
    logging: 30,
    log: [],
    name: "",
    progress: 0,
    percent: 0,
    waiting: false,
    warning: false,
    worked: false,
    delay_duration: 0,
    end_timestamp: '',
    init_timestamp: '',
    running_duration: 0,
    start_timestamp: '',
    total_duration: 0
  };

  canManage: boolean = false;

  constructor(
    private _snackBar: MatSnackBar,
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
      .subscribe({
        next: data => {
          this.task_data = data;
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  cancelTask() {
    this.processService.cancelProcessStatus(this.task_id)
      .pipe(first())
      .subscribe({
        next: data => {
          this.refreshData();
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  promoteTask() {
    this.processService.promoteProcessTask(this.task_id)
      .pipe(first())
      .subscribe({
        next: data => {
          this.refreshData();
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  changeProcessLevel(level: number) {
    this.processService.changeProcessLevel(this.task_id, level)
      .pipe(first())
      .subscribe({
        next: data => {
          this.refreshData();
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  keyForLevel(level: number) {
    return this.processService.getLoggingLevelKey(level);
  }

  isRunning() {
    return this.task_id > 0 && !this.task_data.finished;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
