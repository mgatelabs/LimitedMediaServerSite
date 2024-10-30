import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';

/**
 * See the details for a Process.  Also control execution.
 */
@Component({
  selector: 'app-process-details',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule, RouterModule],
  templateUrl: './process-details.component.html',
  styleUrl: './process-details.component.css'
})
export class ProcessDetailsComponent implements OnInit, OnDestroy {

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

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  constructor(private authService: AuthService, public processService: ProcessService, private route: ActivatedRoute, private _snackBar: MatSnackBar) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.clearTimer();

    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.task_id = parseInt(params['task_id']);
      this.refreshData();
    });

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  refreshData() {
    this.processService.singleProcessStatus(this.task_id)
      .pipe(first())
      .subscribe(data => {
        this.task_data = data;

        if (this.task_data.finished && this.timer_running) {
          this.clearTimer();
        }
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
}
