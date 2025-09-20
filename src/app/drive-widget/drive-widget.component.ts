import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { HealthService, StorageInfo } from '../health.service';
import { first, Subject } from 'rxjs';
import { ByteFormatPipe } from "../byte-format.pipe";
import {ProgressSpinnerMode, MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-drive-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, MatListModule, MatProgressSpinnerModule, TranslocoDirective, ByteFormatPipe],
  templateUrl: './drive-widget.component.html',
  styleUrl: './drive-widget.component.css'
})
export class DriveWidgetComponent implements OnInit, OnDestroy {

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  public drives: StorageInfo[] = [];

  constructor(private healthService: HealthService, private router: Router) {

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
      this.healthService.fetchDrives().pipe(first()).subscribe({next: data => {
        this.drives = data;
      }, error: error => {

      }});
    }

}
