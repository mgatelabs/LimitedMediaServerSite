import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ActionPlugin, PluginService } from './plugin.service';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessListingDialogComponent } from './process-listing-dialog/process-listing-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { WaitForServerComponent } from "./wait-for-server/wait-for-server.component";
import { ProcessService } from './process.service';
import { DurationFormatPipe } from './duration-format.pipe';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NoticeService } from './notice.service';
import { LoadingSpinnerComponent } from "./loading-spinner/loading-spinner.component";
import { PluginDialogService } from './plugin-dialog.service';
import { ImageStateNumberService } from './image-state-number.service';
import { PortalModule } from '@angular/cdk/portal';
import { HamburgerMenuComponent } from "./hamburger-menu/hamburger-menu.component";
import { ThemeService } from './theme.service';
import { TrackingService } from './tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, PortalModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, WaitForServerComponent, DurationFormatPipe, TranslocoDirective, LoadingSpinnerComponent, HamburgerMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'BookBrowser';

  generalPlugins: ActionPlugin[] = [];
  utilityPlugins: ActionPlugin[] = [];
  bookPlugins: ActionPlugin[] = [];
  mediaPlugins: ActionPlugin[] = [];

  showMenu: boolean = true;

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
  canHardSession: boolean = false;
  hasHardSession: boolean = false;

  startPolling: boolean = false; // Trigger for the child component

  current_lang: string = 'en';

  private resizeHandler = () => this.resetZoom();

  constructor(
    private processService: ProcessService,
    public processListingDialog: MatDialog,
    breakpointObserver: BreakpointObserver,
    private pluginService: PluginService,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private translocoService: TranslocoService,
    private noticeService: NoticeService,
    private pluginRunDialog: PluginDialogService,
    private readonly imageStateNumberService: ImageStateNumberService,
    private themeService: ThemeService,
    private trackingService: TrackingService
  ) {

    if (localStorage.getItem('lang')) {
      let local_lang = localStorage.getItem('lang') || 'en';
      switch (local_lang) {
        case 'es':
        case 'fr':
        case 'de':
        case 'en':
        case 'spooky':
          break;
        default:
          local_lang = 'en';
          break;
      }
      if (local_lang !== 'en') {
        this.current_lang = local_lang;
        translocoService.setActiveLang(local_lang);
      }
    }

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe({
      next: result => {
        if (result.matches) {
          if (result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small]) {
            this.numberOfColumns = 1;
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.numberOfColumns = 2;
          } else if (result.breakpoints[Breakpoints.Large] || result.breakpoints[Breakpoints.XLarge]) {
            this.numberOfColumns = 3;
          }
        }
      }, error: msg => {

      }
    });

  }

  get bodyClass(): string {
    if (this.numberOfColumns == 1) {
      return 'mini';
    }
    return 'full';
  }

  get isDarkTheme(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  get isTrackingEnabled(): boolean {
    return this.trackingService.enabled;
  }

  toggleTracking() {
    this.trackingService.toggle();
  }

  getLoginTimeLeft(): number {
    return this.authService.getSessionTimeRemaining();
  }

  ngOnInit() {
    this.pluginService.getPlugins()
      .subscribe(data => {
        this.generalPlugins = PluginService.filterPlugins(data, 'general', true);
        this.utilityPlugins = PluginService.filterPlugins(data, 'utility', true);
        this.bookPlugins = PluginService.filterPlugins(data, 'book', true);
        this.mediaPlugins = PluginService.filterPlugins(data, 'media', true);
      });


    this.authService.sessionData$.subscribe(data => {
      this.authenticated = this.authService.isLoggedIn();
      // Area Access
      this.showBooks = this.authService.isFeatureEnabled(this.authService.features.VIEW_VOLUME);
      this.showMedia = this.authService.isFeatureEnabled(this.authService.features.VIEW_MEDIA);

      // Manage Access
      this.canManageApp = this.authService.isFeatureEnabled(this.authService.features.MANAGE_APP);
      this.canManageBooks = this.authService.isFeatureEnabled(this.authService.features.MANAGE_VOLUME);
      this.canManageMedia = this.authService.isFeatureEnabled(this.authService.features.MANAGE_MEDIA);

      // Processing
      this.showProcesses = this.authService.isFeatureEnabled(this.authService.features.VIEW_PROCESSES);
      this.showUtils = this.authService.isFeatureEnabled(this.authService.features.UTILITY_PLUGINS);
      this.showPlugins = this.authService.isFeatureEnabled(this.authService.features.GENERAL_PLUGINS);

      // Sesison Management
      this.canHardSession = this.authService.isFeatureEnabled(this.authService.features.HARD_SESSIONS);
      this.hasHardSession = this.authService.hasHardSession();
    });

    window.addEventListener('orientationchange', this.resizeHandler);
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('orientationchange', this.resizeHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/a-login');
  }

  renew() {
    this.authService.renew().subscribe(
      () => {

      }
    );
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

  openProcessListingDialog(): void {
    const dialogRef = this.processListingDialog.open(ProcessListingDialogComponent, {
      width: window.innerWidth < 640 ? '100%' : '880px',
      maxWidth: '100vw',
      data: { message: 'Hello World' }
    });
  }

  refresh() {
    window.location.reload();
  }

  refreshImages() {
    this.imageStateNumberService.regenerate();
  }

  // Server Control

  restartServer() {
    if (confirm(this.noticeService.getMessage('msgs.are_sure_server_restart'))) {
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
    if (confirm(this.noticeService.getMessage('msgs.are_sure_server_stop'))) {
      this.processService.stopServer()
        .subscribe(data => {

          this._snackBar.open('Stop Sent', undefined, {
            duration: 3000
          });

        });
    }
  }

  establishHardSession() {
    this.router.navigateByUrl('/a-hard-sessions/new');
  }

  removeHardSession() {
    if (confirm(this.noticeService.getMessage('msgs.are_sure_remove_pin'))) {
      this.authService.clearHardSession();
    }
  }

  viewMyHardSessions() {
    this.router.navigate(['/a-hard-sessions', 'mine']);
  }

  viewAllHardSessions() {
    this.router.navigate(['/a-hard-sessions', 'list']);
  }

  viewSourceLink() {
    window.open('https://github.com/mgatelabs/LimitedMediaServer');
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  changeLanguage(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.current_lang = lang;
    localStorage.setItem('lang', lang);
  }


  // Plugins

  getPluginName(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.name', {}, plugin.name)
    }
    return plugin.name;
  }

  getPluginTitle(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.title', {}, plugin.name)
    }
    return '';
  }

  private resetZoom() {
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewport) {
      // Reset the viewport meta to force scale back to 1
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
  }

  public showGlobalPlugin(pluginId: string) {
    this.pluginRunDialog.openPluginAction({
      data: {
        action_id: pluginId
      },      
      modal: false
    });
  }
}
