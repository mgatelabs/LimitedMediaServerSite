import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { ProcessDetailsCardComponent } from "../process-details-card/process-details-card.component";
import { ProcessStatusCardComponent } from "../process-status-card/process-status-card.component";
import { ProcessInfoCardComponent } from "../process-info-card/process-info-card.component";
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslocoDirective } from '@jsverse/transloco';
import { ServerStatusComponent } from "../server-status/server-status.component";
import { DEFAULT_ITEM_LIMIT } from '../constants';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

/**
 * See the details for a Process.  Also control execution.
 */
@Component({
  selector: 'app-process-details',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatToolbarModule, RouterModule, MatProgressBarModule, MatCardModule, ProcessDetailsCardComponent, ProcessStatusCardComponent, ProcessInfoCardComponent, TranslocoDirective, ServerStatusComponent],
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
    logging: 30,
    worked: false,
    delay_duration: 0,
    end_timestamp: '',
    init_timestamp: '',
    running_duration: 0,
    start_timestamp: '',
    total_duration: 0,
    book_id: '',
    folder_id: '',
    weight: 1,
    priority: 0
  };

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  constructor(private authService: AuthService, public processService: ProcessService, private route: ActivatedRoute, private _snackBar: MatSnackBar, private clipboard: Clipboard, breakpointObserver: BreakpointObserver) {

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.numberOfColumns = 1;
        } else if (result.breakpoints[Breakpoints.Small]) {
          this.numberOfColumns = 2;
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.numberOfColumns = 4;
        } else if (result.breakpoints[Breakpoints.Large]) {
          this.numberOfColumns = 6;
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this.numberOfColumns = 8;
        }
      }
    });

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
      .subscribe({
        next: data => {
          this.task_data = data;
          if (this.task_data.finished && this.timer_running) {
            this.clearTimer();
          }
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
    this.processService.changeProcessLevel(this.task_id, level).pipe(first())
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

  // Paging

  numberOfColumns: number = 1;
  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;
  private itemPrefix: string = '';

  get shouldHidePageSize(): boolean {
    return this.numberOfColumns === 1;
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    if (this.pageSize != event.pageSize) {
      this.pageIndex = 0;
    }
    this.pageSize = event.pageSize;

    //Utility.setAttrValue(ATTR_LOGGING_PAGESIZE, this.pageSize.toString(), this.itemPrefix);

    //this.refresh();
  }
}
