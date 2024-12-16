import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { catchError, first } from 'rxjs/operators';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-wait-for-server',
  standalone: true,
  templateUrl: './wait-for-server.component.html',
  imports: [TranslocoDirective],
})
export class WaitForServerComponent {
  @Input() trigger: boolean = false; // Input to trigger polling from the parent
  isWaiting: boolean = false;
  pollingInterval: Subscription | null = null;

  constructor(private http: HttpClient) {}

  ngOnChanges(): void {
    if (this.trigger && !this.isWaiting) {
      this.startPolling();
    }
  }

  startPolling(): void {
    this.isWaiting = true;
    
    // Start polling the server every 5 seconds
    this.pollingInterval = interval(5000).subscribe(() => {
      this.checkServerStatus();
    });
  }

  checkServerStatus(): void {
    this.http.post('/api/health/alive', {}) // Replace with your server's health check endpoint
      .pipe(first())
      .pipe(
        catchError(() => {
          // Catch errors if the server is down and keep waiting
          return [];
        })
      )
      .subscribe(response => {
        if (response) {
          // Server is back, reload the page
          this.reloadPage();
        }
      });
  }

  reloadPage(): void {
    if (this.pollingInterval) {
      this.pollingInterval.unsubscribe(); // Stop the polling
    }
    this.isWaiting = false;
    window.location.reload(); // Reload the current page
  }
}
