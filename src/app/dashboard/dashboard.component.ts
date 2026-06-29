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
import { TranslocoDirective } from '@jsverse/transloco';
import { DriveWidgetComponent } from "../drive-widget/drive-widget.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

const STORAGE_KEY = 'dashboard_widget_visibility';

interface WidgetVisibility {
  books: boolean;
  media: boolean;
  drives: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatToolbarModule, RecentWidgetComponent, MatGridListModule,
    RecentMediaWidgetComponent, TranslocoDirective, DriveWidgetComponent,
    MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, FormsModule, MatDividerModule, MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnDestroy, OnInit {

  numberOfColumns: number = 1;

  authenticated: boolean = false;
  showBooks: boolean = false;
  showMedia: boolean = false;
  showDrives: boolean = false;

  visibility: WidgetVisibility = { books: true, media: true, drives: true };

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private authService: AuthService, private volumeService: VolumeService, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver, private route: ActivatedRoute) {
    this.loadVisibility();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {});

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
        this.showBooks = this.authService.isFeatureEnabled(this.authService.features.VIEW_VOLUME);
        this.showMedia = this.authService.isFeatureEnabled(this.authService.features.VIEW_MEDIA);
        this.showDrives = this.authService.isFeatureEnabled(this.authService.features.MANAGE_APP);
      });
  }

  private loadVisibility(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.visibility = { ...this.visibility, ...JSON.parse(saved) };
      }
    } catch { }
  }

  saveVisibility(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.visibility));
  }

  get anyHidden(): boolean {
    return !this.visibility.books || !this.visibility.media || !this.visibility.drives;
  }

  get hiddenCount(): number {
    return [this.visibility.books, this.visibility.media, this.visibility.drives]
      .filter(v => !v).length;
  }
}
