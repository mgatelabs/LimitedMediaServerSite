import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '../auth.service';
import { DurationFormatPipe } from '../duration-format.pipe';
import { interval, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-session-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, TranslocoDirective, DurationFormatPipe],
  templateUrl: './session-widget.component.html',
  styleUrl: './session-widget.component.css'
})
export class SessionWidgetComponent implements OnInit, OnDestroy {

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  // Below this many seconds the ring turns to warn color (matches the auto-renew threshold)
  private static readonly LOW_THRESHOLD = 5 * 60;

  authenticated: boolean = false;
  secondsLeft: number = 0;
  percent: number = 0;
  renewing: boolean = false;

  constructor(private authService: AuthService) {

  }

  ngOnInit() {
    // Keep the authenticated state (and the ring) in sync with the session
    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.authenticated = this.authService.isLoggedIn();
      this.refreshRemaining();
    });

    // Live countdown
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshRemaining());
    this.refreshRemaining();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isLow(): boolean {
    return this.authenticated && this.secondsLeft < SessionWidgetComponent.LOW_THRESHOLD;
  }

  get spinnerColor(): string {
    return this.isLow ? 'warn' : 'primary';
  }

  private refreshRemaining() {
    this.secondsLeft = this.authService.getSessionTimeRemaining();

    const total = this.getTotalSeconds();
    this.percent = total > 0 ? Math.max(0, Math.min(100, (this.secondsLeft / total) * 100)) : 0;
  }

  private getTotalSeconds(): number {
    const token = this.authService.getToken();
    if (!token) return 0;
    const data = this.authService.parseToken(token);
    if (data && data.exp && data.iat) {
      return data.exp - data.iat;
    }
    return 0;
  }

  renew() {
    if (this.renewing || !this.authenticated) return;
    this.renewing = true;
    this.authService.renew().subscribe({
      next: () => {
        this.renewing = false;
        this.refreshRemaining();
      },
      error: () => {
        this.renewing = false;
      }
    });
  }
}
