import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessService, StatusData, StatusWrapper } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { TranslocoDirective } from '@jsverse/transloco';
import { ServerStatusComponent } from '../server-status/server-status.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ATTR_LOGGING_PAGESIZE, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP } from '../constants';
import { MatPaginator } from "@angular/material/paginator";
import { Utility } from '../utility';

/**
 * View current processes
 */
@Component({
  selector: 'app-process-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule, MatListModule, TranslocoDirective, ServerStatusComponent, MatPaginator],
  templateUrl: './process-listing.component.html',
  styleUrl: './process-listing.component.css'
})
export class ProcessListingComponent implements OnInit, OnDestroy {

  @ViewChild('cancelTimerBtn', { static: false }) cancelTimerBtn!: ElementRef<HTMLButtonElement>;
  private strobeTimeoutId: any;

  statusPackage: StatusWrapper = { tasks: [], workers: [], page: 0, pages: 0, total: 0};

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  refresh_mode: string = "NONE";

  constructor(private authService: AuthService, private dataService: ProcessService, breakpointObserver: BreakpointObserver) {

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
    // Fetch data from the API using the DataService

    let local_pagesize = Utility.getAttrValue(ATTR_LOGGING_PAGESIZE, '20', this.itemPrefix);

    if (Utility.isNotBlank(local_pagesize)) {
      this.pageSize = PAGE_SIZE_LOOKUP[local_pagesize] || 20;
    }

    this.refresh();

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });


  }

  refresh() {
    this.refreshList(true, this.refresh_mode);
  }

  refreshList(clear_history: boolean = false, extra_method: string = "NONE") {
    this.dataService.allProcessStatus(clear_history, extra_method, this.pageIndex, this.pageSize)
      .pipe(first())
      .subscribe({
        next: data => {
          this.pageIndex = data.page;
          this.totalItems = data.total;
          this.statusPackage = data;
        }, error: error => {
          // Display the error handled by `handleCommonError`
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  getStatusFor(item: StatusData) {
    if (item.failure) {
      return "Failure";
    }
    if (item.finished) {
      if (item.worked) {
        return "Finished";
      }
      return "Fruitless completion";
    }
    if (item.waiting) {
      return "Waiting";
    }
    return "Running";
  }

  getclasssFor(item: StatusData) {
    if (item.failure) {
      return "clicker status-failure";
    }
    if (item.finished) {
      if (item.warning) {
        return "clicker status-warning";
      } else if (item.failure) {
        return "clicker  status-failure";
      } else if (item.worked) {
        return "clicker status-worked";
      }
      return "clicker status-finished";
    }
    if (item.waiting) {
      return "clicker status-waiting";
    }
    return "clicker status-running";
  }

  getItemStatueName(item: StatusData): string {
    if (item.failure) {
      return "failure";
    }
    if (item.finished) {
      if (item.warning) {
        return "warning";
      } else if (item.failure) {
        return "failure";
      } else if (item.worked) {
        return "worked";
      }
      return "finished";
    }
    if (item.waiting) {
      return "waiting";
    }
    return "running";
  }

  getIconFor(item: StatusData) {
    if (item.failure) {
      return "error";
    }
    if (item.finished) {
      if (item.failure) {
        return "error";
      } else if (item.warning) {
        return "warning";
      } else if (item.worked) {
        return "check_finished";
      }
      return "sailing";
    }
    if (item.waiting) {
      return "pending";
    }
    return "play_arrow";
  }

  timerEvent() {
    this.refreshList(true, this.refresh_mode);
  }

  startTimer() {
    this.timer_running = true;
    this.planRefreshStrobe()
    this.timer_number = setInterval(() => {
      this.timerEvent();
      this.cancelRefreshStrobe();
      this.planRefreshStrobe();
    }, 10000);
  }

  clearTimer() {
    this.timer_running = false;
    if (this.timer_number) {
      clearInterval(this.timer_number);
      this.timer_number = undefined;
    }
    this.cancelRefreshStrobe();
  }

  setRefreeshMode(value: string) {
    this.refresh_mode = value;
    this.refresh();
  }

  planRefreshStrobe() {
    setTimeout(() => {
      if (this.cancelTimerBtn && this.cancelTimerBtn.nativeElement) {
        this.cancelTimerBtn.nativeElement.classList.add('strobe');
      }
    }, 6000);
  }

  cancelRefreshStrobe() {
    if (this.strobeTimeoutId) {
      clearInterval(this.strobeTimeoutId);
      this.strobeTimeoutId = null;
    }
    if (this.cancelTimerBtn && this.cancelTimerBtn.nativeElement) {
      this.cancelTimerBtn.nativeElement.classList.remove('strobe');
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

    Utility.setAttrValue(ATTR_LOGGING_PAGESIZE, this.pageSize.toString(), this.itemPrefix);

    this.refresh();
  }
}
