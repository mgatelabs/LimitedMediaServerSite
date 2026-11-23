import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { StatusData } from '../process.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { DurationFormatPipe } from '../duration-format.pipe';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-process-details-card',
  standalone: true,
  imports: [MatIconModule, TranslocoDirective, MatMenuModule, MatToolbarModule, RouterModule, MatProgressBarModule, MatCardModule, DurationFormatPipe],
  templateUrl: './process-details-card.component.html',
  styleUrl: './process-details-card.component.css'
})
export class ProcessDetailsCardComponent {

  @Input() task_data?: StatusData;

  get estimatedDuration(): number | null {
    if (!this.task_data) {
      //console.log('[est] no task_data');
      return null;
    }
    if (this.task_data.finished) {
      //console.log('[est] finished = true');
      return null;
    }
    if (this.task_data.waiting) {
      //console.log('[est] waiting = true');
      return null;
    }
    const running = this.task_data.running_duration;
    const percent = this.task_data.progress;
    if (running <= 30) {
      //console.log(`[est] running_duration=${running} (<= 30)`);
      return null;
    }
    if (!percent || percent <= 1) {
      //console.log(`[est] percent=${percent} (<= 1)`);
      return null;
    }
    const totalTimeEstimate = running / (percent / 100);
    const timeLeft = Math.max(0, totalTimeEstimate - running);
    //console.log(`[est] OK: running=${running}, percent=${percent} => est=${Math.round(timeLeft)}`);
    return Math.round(timeLeft);
  }

}
