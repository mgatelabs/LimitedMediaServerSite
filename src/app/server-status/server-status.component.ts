import { Component } from '@angular/core';
import { Subscription, switchMap, timer } from 'rxjs';
import { HealthService, SysInfo } from '../health.service';
import { ByteFormatPipe } from '../byte-format.pipe';

@Component({
  selector: 'app-server-status',
  standalone: true,
  imports: [ByteFormatPipe],
  templateUrl: './server-status.component.html',
  styleUrl: './server-status.component.css'
})
export class ServerStatusComponent {

  stats? : SysInfo;

  private statsSubscription!: Subscription;

  constructor(private statsService: HealthService) {}

  ngOnInit(): void {
    // Start polling every 10 seconds
    this.statsSubscription = timer(0, 10000) // Start immediately, then every 10 seconds
      .pipe(
        switchMap(() => this.statsService.fetchStats()) // Switch to the observable returned by the service
      )
      .subscribe({
        next: (data) => (this.stats = data),
        error: (err) => false//console.error('Failed to fetch stats:', err)
      });
  }

  ngOnDestroy(): void {
    // Clean up the subscription
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

}
