import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessService, StatusData, StatusWrapper, LogDownloadFormat, WorkerStatus, StatusFile } from '../process.service';
import { AuthService } from '../auth.service';
import { RecentItemsService } from '../recent-items.service';
import { first, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs';
import { NoticeService } from '../notice.service';
import { ATTR_LOGGING_PAGESIZE, ATTR_PROCESS_PAGEINDEX, PAGE_SIZE_LOOKUP, DEFAULT_ITEM_LIMIT } from '../constants';
import { Utility } from '../utility';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { ProcessDetailsCardComponent } from "../process-details-card/process-details-card.component";
import { ProcessStatusCardComponent } from "../process-status-card/process-status-card.component";
import { ProcessInfoCardComponent } from "../process-info-card/process-info-card.component";
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslocoDirective } from '@jsverse/transloco';
import { ServerStatusComponent } from "../server-status/server-status.component";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ProcessLogCardComponent } from "../process-log-card/process-log-card.component";
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { ByteFormatPipe } from '../byte-format.pipe';
import { CommonModule } from '@angular/common';

/**
 * See the details for a Process.  Also control execution.
 */
@Component({
  selector: 'app-process-details',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, MatExpansionModule, MatTabsModule, MatMenuModule, MatToolbarModule, RouterModule, MatProgressBarModule, MatCardModule, ProcessDetailsCardComponent, ProcessStatusCardComponent, ProcessInfoCardComponent, TranslocoDirective, ServerStatusComponent, ProcessLogCardComponent],
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
    folder_img: false,
    weight: 1,
    priority: 0
  };

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  isNavigating: boolean = false;

  assignedWorker: WorkerStatus | null = null;

  // 0: details, 1: logs, 2: files
  readonly TAB_FILES: number = 2;
  currentTabIndex: number = 0;

  readonly isMobile$ = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map(result => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  constructor(private authService: AuthService, public processService: ProcessService, private route: ActivatedRoute, private _snackBar: MatSnackBar, private clipboard: Clipboard, private breakpointObserver: BreakpointObserver, private recentItemsSvc: RecentItemsService, private router: Router, private noticeService: NoticeService) {

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

  public onTabChange(index: number) {
    this.currentTabIndex = index;
    if (index === this.TAB_FILES && !this.task_data.files) {
      this.refreshData();
    }
  }

  public formatFileSize(bytes: number): string {
    return ByteFormatPipe.formatValue(bytes);
  }

  public trackByFile(index: number, file: StatusFile): string {
    return file.name;
  }

  refreshData() {
    this.processService.singleProcessStatus(this.task_id, this.logPageIndex, this.logPageSize, this.currentTabIndex === this.TAB_FILES)
      .pipe(first())
      .subscribe({
        next: data => {
          this.task_data = data;
          this.logTotalItems = data.log_total ?? data.log.length;
          this.recentItemsSvc.add('process/task', String(this.task_id), `${this.task_data.name}${this.task_data.description ? ': ' + this.task_data.description : ''}`);
          if (this.task_data.finished && this.timer_running) {
            this.clearTimer();
          }
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
    this.processService.allProcessStatus(false, 'NONE', 0, 1)
      .pipe(first())
      .subscribe({ next: data => {
        this.assignedWorker = data.workers.find(w => w.job === this.task_id) ?? null;
      }});
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

  navigateTask(direction: 'prev' | 'next') {
    this.isNavigating = true;

    const pageSizeStr = Utility.getAttrValue(ATTR_LOGGING_PAGESIZE, '20', '');
    const pageSize = PAGE_SIZE_LOOKUP[pageSizeStr] ?? DEFAULT_ITEM_LIMIT;
    const pageIndexStr = Utility.getAttrValue(ATTR_PROCESS_PAGEINDEX, '0', '', true);
    let pageIndex = 0;
    try { pageIndex = parseInt(pageIndexStr) || 0; } catch (_) {}

    const goToTask = (taskId: number, newPageIndex?: number) => {
      if (newPageIndex !== undefined) {
        Utility.setAttrValue(ATTR_PROCESS_PAGEINDEX, newPageIndex.toString(), '', true);
      }
      this.isNavigating = false;
      this.router.navigate(['/a-task', taskId]);
    };

    const showUnavailable = (msgKey: string) => {
      this.isNavigating = false;
      this._snackBar.open(this.noticeService.getMessage(msgKey), undefined, { duration: 3000 });
    };

    this.processService.allProcessStatus(false, 'NONE', pageIndex, pageSize)
      .pipe(first())
      .subscribe({
        next: (data: StatusWrapper) => {
          const foundIndex = data.tasks.findIndex(t => t.id === this.task_id);
          if (foundIndex === -1) {
            showUnavailable('msgs.nav_not_available');
            return;
          }
          if (direction === 'next') {
            if (foundIndex + 1 < data.tasks.length) {
              goToTask(data.tasks[foundIndex + 1].id);
            } else if (pageIndex + 1 < data.pages) {
              this.processService.allProcessStatus(false, 'NONE', pageIndex + 1, pageSize)
                .pipe(first())
                .subscribe({
                  next: (nextPage: StatusWrapper) => {
                    nextPage.tasks.length > 0
                      ? goToTask(nextPage.tasks[0].id, pageIndex + 1)
                      : showUnavailable('msgs.no_next_task');
                  },
                  error: () => showUnavailable('msgs.nav_not_available')
                });
            } else {
              showUnavailable('msgs.no_next_task');
            }
          } else {
            if (foundIndex - 1 >= 0) {
              goToTask(data.tasks[foundIndex - 1].id);
            } else if (pageIndex > 0) {
              this.processService.allProcessStatus(false, 'NONE', pageIndex - 1, pageSize)
                .pipe(first())
                .subscribe({
                  next: (prevPage: StatusWrapper) => {
                    prevPage.tasks.length > 0
                      ? goToTask(prevPage.tasks[prevPage.tasks.length - 1].id, pageIndex - 1)
                      : showUnavailable('msgs.no_prev_task');
                  },
                  error: () => showUnavailable('msgs.nav_not_available')
                });
            } else {
              showUnavailable('msgs.no_prev_task');
            }
          }
        },
        error: () => showUnavailable('msgs.nav_not_available')
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

  copyAllLogs(): void {
    const text = this.task_data.log.map(l => l.text).join('\n\n');
    this.copyTextToClipboard(text);
  }

  downloadLog(format: LogDownloadFormat): void {
    this.processService.downloadLog(this.task_id, format);
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

  // Layout paging (unrelated to log paging)
  numberOfColumns: number = 1;

  get shouldHidePageSize(): boolean {
    return this.numberOfColumns === 1;
  }

  // Log paging
  logTotalItems: number = 0;
  logPageSize: number = 50;
  logPageIndex: number = 0;

  onPageChange(event: any) {
    this.logPageIndex = event.pageIndex;
    if (this.logPageSize !== event.pageSize) {
      this.logPageIndex = 0;
    }
    this.logPageSize = event.pageSize;
    this.refreshData();
  }
}
