import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ActionPlugin, PluginService } from './plugin.service';
import { HistoryData, NavData, VolumeService } from './volume.service';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessListingDialogComponent } from './process-listing-dialog/process-listing-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, first, of } from 'rxjs';
import { WaitForServerComponent } from "./wait-for-server/wait-for-server.component";
import { ProcessService } from './process.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, WaitForServerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'BookBrowser';

  generalPlugins: ActionPlugin[] = [];
  utilityPlugins: ActionPlugin[] = [];
  bookPlugins: ActionPlugin[] = [];
  mediaPlugins: ActionPlugin[] = [];

  showMenu: boolean = true;

  histotyData: HistoryData[] = [];
  limitedHistotyData: HistoryData[] = [];

  navData: NavData = { book: "", chapter: "", next: '', prev: '', mode: '' }

  numberOfColumns: number = 1;

  authenticated: boolean = false;
  showBooks: boolean = false;
  showMedia: boolean = false;
  showUtils: boolean = false;
  showProcesses: boolean = false;
  showPlugins: boolean = false;
  canManageBooks: boolean = false;
  canManageMedia: boolean = false;
  canManageApp: boolean = false;

  startPolling: boolean = false; // Trigger for the child component

  constructor(private processService: ProcessService, public processListingDialog: MatDialog, breakpointObserver: BreakpointObserver, private pluginService: PluginService, private authService: AuthService, private _snackBar: MatSnackBar, private volumeService: VolumeService, private router: Router) {

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small]) {
          this.numberOfColumns = 1;
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.numberOfColumns = 2;
        } else if (result.breakpoints[Breakpoints.Large] || result.breakpoints[Breakpoints.XLarge]) {
          this.numberOfColumns = 3;
        }
      }
    });

  }

  get bodyClass(): string {
    if (this.numberOfColumns == 1) {
      return 'mini';
    }
    return 'full';
  }

  ngOnInit() {
    this.pluginService.getPlugins()
      .subscribe(data => {
        this.generalPlugins = PluginService.filterPlugins(data, 'general', true);
        this.utilityPlugins = PluginService.filterPlugins(data, 'utility', true);
        this.bookPlugins = PluginService.filterPlugins(data, 'book', true);
        this.mediaPlugins = PluginService.filterPlugins(data, 'media', true);
      });

    this.volumeService.navData$.subscribe(data => {
      this.navData = data;
    });

    this.volumeService.historyData$
      .subscribe(data => {
        this.histotyData = data;
        this.limitedHistotyData = this.histotyData.slice(0, 8);
      });

    this.authService.sessionData$.subscribe(data => {
      this.authenticated = this.authService.isLoggedIn();
      this.showBooks = this.authService.isFeatureEnabled(this.authService.features.VIEW_BOOKS);
      this.showMedia = this.authService.isFeatureEnabled(this.authService.features.VIEW_MEDIA);
      this.canManageApp = this.authService.isFeatureEnabled(this.authService.features.MANAGE_APP);
      this.canManageBooks = this.authService.isFeatureEnabled(this.authService.features.MANAGE_BOOK);
      this.canManageMedia = this.authService.isFeatureEnabled(this.authService.features.MANAGE_MEDIA);
      this.showProcesses = this.authService.isFeatureEnabled(this.authService.features.VIEW_PROCESSES);
      this.showUtils = this.authService.isFeatureEnabled(this.authService.features.UTILITY_PLUGINS);
      this.showPlugins = this.authService.isFeatureEnabled(this.authService.features.GENERAL_PLUGINS);
    });
  }

  clearHistory() {
    this.volumeService.clearHistory();
  }

  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/a-login');
  }

  renew() {
    this.authService.renew().subscribe(
      () => {
        this._snackBar.open('Token Refreshed', undefined, {
          duration: 3000
        });
      }
    );
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

  openProcessListingDialog(): void {
    const dialogRef = this.processListingDialog.open(ProcessListingDialogComponent, {
      width: window.innerWidth < 768 ? '95%' : '600px', // Adjust width for mobile
      maxWidth: '100vw', // Limit dialog width to viewport size
      data: { message: 'Hello World' }
    });
  }

  refresh() {
    window.location.reload();
  }

  syncViewed() {
    this.volumeService.syncViewed()
      .pipe(first())
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to sync'; // Use the error message if available
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);  // Return a fallback value or empty observable
        })
      )
      .subscribe(result => {
        if (result) {
          this.volumeService.updateViewed(result.viewed, result.history);
          this._snackBar.open('Synced', undefined, {
            duration: 3000
          });
        }
      });
  }

  // Server Control

  restartServer() {
    if (confirm('Restart Server, Are you sure?')) {
      this.processService.restartServer()
        .subscribe(data => {

        });

      this._snackBar.open('Restart Sent', undefined, {
        duration: 3000
      });

      this.startPolling = true;
    }
  }

  stopServer() {
    if (confirm('Strop Server, Are you sure?')) {
      this.processService.stopServer()
        .subscribe(data => {

          this._snackBar.open('Stop Sent', undefined, {
            duration: 3000
          });

        });
    }
  }

}
