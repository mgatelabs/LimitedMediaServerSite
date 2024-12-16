import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ProcessService, StatusData } from '../process.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-process-status-card',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule, RouterModule, MatProgressBarModule, MatCardModule, TranslocoDirective],
  templateUrl: './process-status-card.component.html',
  styleUrl: './process-status-card.component.css'
})
export class ProcessStatusCardComponent {
  @Input() task_data?: StatusData;
  constructor(public processService: ProcessService) {

  }
}
