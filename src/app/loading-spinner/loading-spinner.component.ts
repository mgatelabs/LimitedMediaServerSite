import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {
  @Input() message?: string = '';
}
