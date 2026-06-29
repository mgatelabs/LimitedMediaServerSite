import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProcessService, StatusData, StatusWrapper } from '../process.service';
import { DecimalPipe, LocationStrategy } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../auth.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Router, RouterModule, UrlSerializer } from '@angular/router';
import { PluginDialogService } from '../plugin-dialog.service';
import { first, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-process-listing-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, DecimalPipe, MatIconModule,
    MatProgressBarModule, MatChipsModule, TranslocoDirective, RouterModule
  ],
  templateUrl: './process-listing-dialog.component.html',
  styleUrl: './process-listing-dialog.component.css'
})
export class ProcessListingDialogComponent implements OnInit, OnDestroy {

  statusPacket: StatusWrapper = { tasks: [], workers: [], page: 0, pages: 0, total: 0 };
  tasks: StatusData[] = [];

  selectedTask: StatusData | null = null;
  selectedTaskDetail: StatusData | null = null;
  showDetail = false;

  canManage = false;
  canMedia = false;
  canBook = false;

  private timer_running = false;
  private detailTimer_running = false;
  private readonly poll_interval_ms = 5000;
  private readonly detail_poll_interval_ms = 2500;

  private destroy$ = new Subject<void>();
  private detailDestroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public dialogRef: MatDialogRef<ProcessListingDialogComponent>,
    private pluginDialogService: PluginDialogService,
    private locationStrategy: LocationStrategy,
    private urlSerializer: UrlSerializer,
    private router: Router,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private dataService: ProcessService
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detailDestroy$.next();
    this.detailDestroy$.complete();
  }

  ngOnInit(): void {
    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
      this.canMedia = this.authService.isFeatureEnabled(this.authService.features.VIEW_MEDIA);
      this.canBook = this.authService.isFeatureEnabled(this.authService.features.VIEW_VOLUME);
    });
    this.startPolling();
  }

  private refresh(): void {
    this.dataService.allProcessStatus(false, 'ACTIVE')
      .subscribe(data => {
        const tempDat: StatusData[] = [];
        for (const task of data.tasks) {
          if (!task.waiting && !task.finished) {
            tempDat.push(task);
          }
        }
        this.tasks = tempDat;
        this.statusPacket = data;
      });
  }

  private startPolling(): void {
    if (this.timer_running) return;
    this.timer_running = true;
    timer(0, this.poll_interval_ms)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.refresh(),
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.timer_running = false;
        }
      });
  }

  selectTask(task: StatusData): void {
    if (this.selectedTask?.id === task.id) return;
    this.selectedTask = task;
    this.selectedTaskDetail = null;
    this.showDetail = true;
    this.startDetailPolling(task.id);
  }

  private startDetailPolling(taskId: number): void {
    this.detailDestroy$.next();
    this.detailTimer_running = false;

    this.detailTimer_running = true;
    timer(0, this.detail_poll_interval_ms)
      .pipe(
        takeUntil(this.detailDestroy$),
        switchMap(() => this.dataService.singleProcessStatus(taskId))
      )
      .subscribe({
        next: data => {
          this.selectedTaskDetail = data;
          if (data.finished) {
            this.detailTimer_running = false;
          }
        },
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.detailTimer_running = false;
        }
      });
  }

  backToList(): void {
    this.showDetail = false;
    this.selectedTask = null;
    this.detailDestroy$.next();
    this.detailTimer_running = false;
  }

  cancelSelectedTask(): void {
    if (!this.selectedTaskDetail || this.selectedTaskDetail.finished) return;
    this.dataService.cancelProcessStatus(this.selectedTaskDetail.id)
      .pipe(first())
      .subscribe({
        error: error => this._snackBar.open(error.message, undefined, { duration: 3000 })
      });
  }

  getStatusName(item: StatusData): string {
    if (item.failure) return 'failure';
    if (item.finished) {
      if (item.warning) return 'warning';
      if (item.worked) return 'worked';
      return 'finished';
    }
    if (item.waiting) return 'waiting';
    return 'running';
  }

  getIconFor(item: StatusData): string {
    if (item.failure) return 'error';
    if (item.warning) return 'warning';
    if (item.finished) return item.worked ? 'check_circle' : 'sailing';
    if (item.waiting) return 'pending';
    return 'play_arrow';
  }

  getDetailStatusLabel(item: StatusData): string {
    if (item.failure) return 'Failed';
    if (item.warning) return 'Warning';
    if (item.finished) return 'Finished';
    if (item.waiting) return 'Initialized';
    return 'Running';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openInPopup(routeParts: (string | number)[], event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const tree = this.router.createUrlTree(routeParts);
    const url = this.locationStrategy.prepareExternalUrl(this.urlSerializer.serialize(tree));
    if (event?.shiftKey) {
      window.open(url, '_blank');
      return;
    }
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const w = Math.floor(sw * 0.9);
    const h = Math.floor(sh * 0.9);
    const left = Math.floor((sw - w) / 2);
    const top = Math.floor((sh - h) / 2);
    window.open(url, '_blank', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  }
}
