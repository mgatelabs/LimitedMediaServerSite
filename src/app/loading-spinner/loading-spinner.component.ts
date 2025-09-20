import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { LoadingService } from '../loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {
  
  isLoading = false;
  message = '';

  constructor(private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe(v => this.isLoading = v);
    this.loadingService.message$.subscribe(m => this.message = m);
  }

}
