import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';

/**
 * View current processes
 */
@Component({
  selector: 'app-process-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule],
  templateUrl: './process-listing.component.html',
  styleUrl: './process-listing.component.css'
})
export class ProcessListingComponent implements OnInit, OnDestroy {

  statusList: StatusData[] = []

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  constructor(private authService: AuthService, private dataService: ProcessService, private _snackBar: MatSnackBar) {

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
    this.dataService.cleanProcessStatus().pipe(first()).subscribe(
      {
        next: data => {
          this.refresh();
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  sweepOldProcesses() {
    this.dataService.sweepProcessStatus().pipe(first()).subscribe({
      next: data => {
        this.refresh();
      }, error: error => {
        // Display the error handled by `handleCommonError`
        this._snackBar.open(error.message, undefined, { duration: 3000 });
      }
    });
  }

  refresh() {
    this.dataService.allProcessStatus()
      .pipe(first())
      .subscribe({
        next: data => {
          this._snackBar.open('Found ' + data.length + ' Tasks', undefined, {
            duration: 3000
          });
          this.statusList = data;
        }, error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
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
      return "status-failure";
    }
    if (item.finished) {
      if (item.warning) {
        return "status-warning";
      } else if (item.failure) {
        return "status-failure";
      } else if (item.worked) {
        return "status-worked";
      }
      return "status-finished";
    }
    if (item.waiting) {
      return "status-waiting";
    }
    return "status-running";
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
