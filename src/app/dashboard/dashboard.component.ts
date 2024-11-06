import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RecentWidgetComponent } from "../recent-volume-widget/recent-volume-widget.component";
import { MatGridListModule } from '@angular/material/grid-list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { VolumeService } from '../volume.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { RecentMediaWidgetComponent } from "../recent-media-widget/recent-media-widget.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatToolbarModule, RecentWidgetComponent, MatGridListModule, RecentMediaWidgetComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnDestroy, OnInit {

  numberOfColumns: number = 1;

  authenticated: boolean = false;
  showBooks: boolean = false;
  showMedia: boolean = false;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private authService: AuthService, private volumeService: VolumeService, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver, private route: ActivatedRoute) {

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['login'] === 'true') {

      }
    });

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result.matches) {
          if (result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small]) {
            this.numberOfColumns = 1;
          } else if (result.breakpoints[Breakpoints.Medium] || result.breakpoints[Breakpoints.Large]) {
            this.numberOfColumns = 2;
          } else if (result.breakpoints[Breakpoints.XLarge]) {
            this.numberOfColumns = 3;
          }
        }
      });

  }

  ngOnInit() {
    this.authService.sessionData$.pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.authenticated = this.authService.isLoggedIn();
        this.showBooks = this.authService.isFeatureEnabled(this.authService.features.VIEW_BOOKS);
        this.showMedia = this.authService.isFeatureEnabled(this.authService.features.VIEW_MEDIA);
      });
  }

}
