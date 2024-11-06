import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { StatusData } from '../process.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { DurationFormatPipe } from '../duration-format.pipe';

@Component({
  selector: 'app-process-details-card',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, MatMenuModule, MatToolbarModule, RouterModule, MatProgressBarModule, MatCardModule, DurationFormatPipe],
  templateUrl: './process-details-card.component.html',
  styleUrl: './process-details-card.component.css'
})
export class ProcessDetailsCardComponent {

  @Input() task_data?: StatusData;

}
