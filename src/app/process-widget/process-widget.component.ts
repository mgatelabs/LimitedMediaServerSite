import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ProcessService, StatusData } from '../process.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-process-widget',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, SlicePipe, MatMenuModule, MatToolbarModule],
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
    worked: false
  };

  timer_running: boolean = false;
  timer_number: any;

  canManage: boolean = false;

  constructor(private authService: AuthService, public processService: ProcessService, private route: ActivatedRoute, private _snackBar: MatSnackBar) {

  }

  ngOnInit() {
    this.authService.sessionData$.subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if the 'task_id' input property has changed
    if (changes['task_id']) {
      const currentValue = changes['task_id'].currentValue;
      const previousValue = changes['task_id'].previousValue;

      this.task_id = currentValue;

      if (currentValue > 0) {
        this.refreshData();
      }
    }
  }

  refreshData() {
    this.processService.singleProcessStatus(this.task_id)
      .subscribe(data => {
        this.task_data = data;

        if (this.task_data.finished && this.timer_running) {
          this.clearTimer();
        }
      });
  }

  cancelTask() {
    this.processService.cancelProcessStatus(this.task_id)
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
