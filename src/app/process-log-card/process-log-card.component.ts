import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-process-log-card',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    TranslocoModule,
  ],
  templateUrl: './process-log-card.component.html',
  styleUrl: './process-log-card.component.css'
})
export class ProcessLogCardComponent {
  @Input({ required: true }) logs: any[] = [];
  @Input({ required: true }) getIcon!: (log: any) => string;
  @Input({ required: true }) getClass!: (log: any) => string;
  @Input({ required: true }) copy!: (text: string) => void;


  isMobile = this.breakpoint.observe(Breakpoints.Handset);


  constructor(private breakpoint: BreakpointObserver) { }


  trackByLog = (_: number, log: any) => log.id ?? log.time;
}
