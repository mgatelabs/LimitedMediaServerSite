import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SlicePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { ProcessStatusCardComponent } from "../process-status-card/process-status-card.component";
import { ProcessDetailsCardComponent } from "../process-details-card/process-details-card.component";
import { ProcessInfoCardComponent } from "../process-info-card/process-info-card.component";
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-process-widget',
  standalone: true,
  imports: [MatIconModule, SlicePipe, MatMenuModule, MatToolbarModule, MatProgressBarModule, MatCardModule, ProcessStatusCardComponent, ProcessDetailsCardComponent, ProcessInfoCardComponent, TranslocoDirective],
  templateUrl: './process-widget.component.html',
  styleUrl: './process-widget.component.css'
})
export class ProcessWidgetComponent implements OnInit, OnDestroy, OnChanges {

  @Input() task_id: number = -1;

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
    logging: 30,
    worked: false,
    delay_duration: 0,
    end_timestamp: '',
    init_timestamp: '',
    running_duration: 0,
    start_timestamp: '',
    total_duration: 0
  };

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, public processService: ProcessService, private route: ActivatedRoute, private _snackBar: MatSnackBar, private clipboard: Clipboard) {

  }

  ngOnInit() {
    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if the 'task_id' input property has changed
    if (changes['task_id']) {
      this.task_id = changes['task_id'].currentValue;
      if (this.task_id > 0) {
        this.refreshData();
      }
    }
  }

  refreshData() {
    this.processService.singleProcessStatus(this.task_id).pipe(first())
      .subscribe({
        next: data => {
          this.task_data = data;

          if (this.task_data.finished && this.timer_running) {
            this.clearTimer();
          }
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  cancelTask() {
    this.processService.cancelProcessStatus(this.task_id).pipe(first())
      .subscribe({
        next: data => {
          this.refreshData();
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  isRunning() {
    return this.task_id > 0 && !this.task_data.finished;
  }

  timerEvent() {
    this._snackBar.open('Refreshing', undefined, {
      duration: 3000
    });
    this.refreshData();
  }

  startTimer() {
    this.timer_running = true;
    this.timer_number = setInterval(() => { this.timerEvent() }, 10000);
  }

  clearTimer() {
    this.timer_running = false;
    if (this.timer_number) {
      clearInterval(this.timer_number);
      this.timer_number = undefined;
    }
  }

  changeProcessLevel(level: number) {
    this.processService.changeProcessLevel(this.task_id, level)
      .pipe(first())
      .subscribe({
        next: data => {
          this.refreshData();
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  keyForLevel(level: number) {
    return this.processService.getLoggingLevelKey(level);
  }

  copyTextToClipboard(text: string): void {
    if (this.clipboard.copy(text)) {
      this._snackBar.open('Clipboard updated', undefined, {
        duration: 3000
      });
    } else {
      this._snackBar.open('Failed to copy text to clipboard', undefined, {
        duration: 3000
      });
    }
  }
}
