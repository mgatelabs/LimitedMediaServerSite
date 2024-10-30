import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChapterData, VolumeService } from '../volume.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ActionPlugin, PluginService } from '../plugin.service';
import { DEFAULT_ITEM_LIMIT } from '../constants';
import { AuthService } from '../auth.service';
import { catchError, first, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chapter-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatMenuModule, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './chapter-listing.component.html',
  styleUrl: './chapter-listing.component.css'
})
export class ChapterListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollToTop') scrollToTop!: ElementRef;

  canPlugin: boolean = false;
  canManage: boolean = false;
  canBookmark: boolean = false;

  chapterData: ChapterData = { style: 'page', chapters: [] };
  selectedBook: string = "";
  selectedChapter: string = "";

  actionPlugins: ActionPlugin[] = [];

  highestChapter: number = -1;

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  isLoading: boolean = false;

  numberOfColumns: number = 1;

  viewed: Map<string, string> = new Map();

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private authService: AuthService, private volumeService: VolumeService, private pluginService: PluginService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {
    breakpointObserver.observe([
      Breakpoints.XSmall,
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        this.numberOfColumns = 1;
      }
    });

    breakpointObserver.observe([
      Breakpoints.Small,
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        this.numberOfColumns = 2;
      }
    });

    breakpointObserver.observe([
      Breakpoints.Medium
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        this.numberOfColumns = 3;
      }
    });

    breakpointObserver.observe([
      Breakpoints.Large,
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        this.numberOfColumns = 4;
      }
    });

    breakpointObserver.observe([
      Breakpoints.XLarge
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        this.numberOfColumns = 5;
      }
    });

  }

  get shouldHidePageSize(): boolean {
    return this.numberOfColumns === 1;
  }

  ngOnInit() {

    this.volumeService.viewedData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.viewed = data;
    });

    this.pluginService.getPlugins()
      .pipe(first())
      .subscribe(data => {
        this.actionPlugins = PluginService.filterPlugins(data, 'book', false);
      });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let bookName = params['book_name'];
      // You can use this.bookName here in your component logic
      if (this.selectedBook === bookName) {
        // Already good
      } else {


        this.chapterData = { style: 'page', chapters: [] };
        this.selectedBook = bookName;

        if (this.viewed.get(this.selectedBook)) {
          this.highestChapter = this.extractDecimalFromString(this.viewed.get(this.selectedBook) || '0');
        } else {
          this.highestChapter = -1;
        }

        this.isLoading = true;

        this.volumeService.fetchChapters(this.selectedBook)
          .pipe(first())
          .pipe(
            catchError(error => {
              // Extract the error message and display it in the snackbar
              const errorMessage = error?.message || 'Failed to fetch chapters'; // Use the error message if available
              this._snackBar.open(errorMessage, undefined, {
                duration: 3000
              });
              this.isLoading = false;
              return of(null);  // Return a fallback value or empty observable
            })
          )
          .subscribe(data => {
            if (data) {
              this.isLoading = false;
              this.volumeService.navigated(this.selectedBook, "");
              this.chapterData = data;
              this.totalItems = this.chapterData.chapters.length;
              this.pageIndex = 0;
            }
          });

      }
    });

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canPlugin = this.authService.isFeatureEnabled(this.authService.features.BOOK_PLUGINS);
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_BOOK);
      this.canBookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
    });
  }

  private extractDecimalFromString(input: string): number {
    // Remove all characters except digits and period
    const cleanedString = input.replace(/[^\d.]/g, '');

    // Parse the cleaned string as a decimal number
    const decimalNumber = parseFloat(cleanedString);

    // If the parsed number is NaN, return 0
    if (isNaN(decimalNumber)) {
      return 0;
    }

    return decimalNumber;
  }

  get pagedItems(): string[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.chapterData.chapters.length);
    return this.chapterData.chapters.slice(startIndex, endIndex);
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.scrollToTop.nativeElement.scrollTop = 0;
  }

  isNewChapter(chapterName: string): boolean {
    let val = this.extractDecimalFromString(chapterName);
    return (val > this.highestChapter);
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

}
