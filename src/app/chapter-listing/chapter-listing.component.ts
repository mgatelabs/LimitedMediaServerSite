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
import { ChapterData, ChapterInfo, VolumeService } from '../volume.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ActionPlugin, PluginService } from '../plugin.service';
import { DEFAULT_ITEM_LIMIT } from '../constants';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { Utility } from '../utility';

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

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  isLoading: boolean = false;

  numberOfColumns: number = 1;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private authService: AuthService, private volumeService: VolumeService, private pluginService: PluginService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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
          if (result.breakpoints[Breakpoints.XSmall]) {
            this.numberOfColumns = 1;
          } else if (result.breakpoints[Breakpoints.Small]) {
            this.numberOfColumns = 2;
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.numberOfColumns = 3;
          } else if (result.breakpoints[Breakpoints.Large]) {
            this.numberOfColumns = 4;
          } else if (result.breakpoints[Breakpoints.XLarge]) {
            this.numberOfColumns = 5;
          }
        }
      });

  }

  get shouldHidePageSize(): boolean {
    return this.numberOfColumns === 1;
  }

  ngOnInit() {

    this.pluginService.getPlugins()
      .pipe(first())
      .subscribe(data => {
        this.actionPlugins = PluginService.filterPlugins(data, 'book', false);
      });

    this.route.params.pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        let bookName = params['book_name'];
        // You can use this.bookName here in your component logic
        if (this.selectedBook === bookName) {
          // Already good
        } else {

          this.chapterData = { style: 'page', chapters: [] };
          this.selectedBook = bookName;

          this.isLoading = true;

          this.volumeService.fetchChapters(this.selectedBook)
            .pipe(first())
            .subscribe({
              next: data => {
                if (data) {
                  this.isLoading = false;
                  this.chapterData = data;
                  this.totalItems = this.chapterData.chapters.length;
                  this.pageIndex = 0;
                }
              }, complete: () => {
                
              }, error: error => {
                this._snackBar.open(error.message, undefined, { duration: 3000 });
              }
            }
            );

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

  get pagedItems(): ChapterInfo[] {
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

  isNewChapter(chapterName: ChapterInfo): boolean {
    return !Utility.isNotBlank(chapterName.value);
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

}
