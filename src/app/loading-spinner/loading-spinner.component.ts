import { Component, Input, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { LoadingService } from '../loading.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent implements OnDestroy {
  
  isLoading = false;
  message = '';

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private loadingService: LoadingService) {
    this.loadingService.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.isLoading = v);
    this.loadingService.message$.pipe(takeUntil(this.destroy$)).subscribe(m => this.message = m);
  }

}
