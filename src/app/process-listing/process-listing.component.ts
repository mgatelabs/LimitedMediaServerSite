import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { TranslocoDirective } from '@jsverse/transloco';

/**
 * View current processes
 */
@Component({
  selector: 'app-process-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule, MatListModule, TranslocoDirective],
  templateUrl: './process-listing.component.html',
  styleUrl: './process-listing.component.css'
})
export class ProcessListingComponent implements OnInit, OnDestroy {

  statusList: StatusData[] = []

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  constructor(private authService: AuthService, private dataService: ProcessService) {

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
    this.refresh();

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  cleanOldProcesses() {    
    this.dataService.cleanProcessStatus(true).pipe(first()).subscribe(
      {
        next: data => {
          this.refreshList();
        }, error: error => {
          // Display the error handled by `handleCommonError`
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  sweepOldProcesses() {
    this.dataService.sweepProcessStatus(true).pipe(first()).subscribe({
      next: data => {
        this.refreshList();
      }, error: error => {
        // Display the error handled by `handleCommonError`
        //this._snackBar.open(error.message, undefined, { duration: 3000 });
      }
    });
  }

  refresh() {
    this.refreshList(true);
  }

  refreshList(clear_history: boolean = false) {
    this.dataService.allProcessStatus(clear_history)
      .pipe(first())
      .subscribe({
        next: data => {
          this.statusList = data;
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
    this.refresh();
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
