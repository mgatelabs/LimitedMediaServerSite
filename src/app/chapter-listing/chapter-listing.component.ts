import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { ATTR_CHAPTER_LAST_VOLUME, ATTR_CHAPTER_PAGEINDEX, ATTR_CHAPTER_PAGESIZE, ATTR_CHAPTER_VIEW_MODE, ATTR_VOLUME_VIEW_MODE, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP, VOLUME_VIEW_MODE_LOOKUP } from '../constants';
import { AuthService } from '../auth.service';
import { first, Subject, takeUntil } from 'rxjs';
import { Utility } from '../utility';
import { MatListModule } from '@angular/material/list';
import { ViewMode } from '../media-browser/ViewMode';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-chapter-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatMenuModule, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent, MatListModule, TranslocoDirective],
  templateUrl: './chapter-listing.component.html',
  styleUrl: './chapter-listing.component.css'
})
export class ChapterListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollToTop') scrollToTop!: ElementRef;
  ViewMode = ViewMode;
  mode: ViewMode = ViewMode.GRID;

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

  private itemPrefix: string = '';
  private chapterPrefix: string = '';

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private authService: AuthService, private volumeService: VolumeService, private pluginService: PluginService, private router: Router, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.canPlugin = this.authService.isFeatureEnabled(this.authService.features.VOLUME_PLUGINS);
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_VOLUME);
      this.canBookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.itemPrefix = data.session.username;
    });

    let local_view_mode = Utility.getAttrValue(ATTR_CHAPTER_VIEW_MODE, 'G', this.itemPrefix);

    if (Utility.isNotBlank(local_view_mode)) {
      this.mode = VOLUME_VIEW_MODE_LOOKUP[local_view_mode] || ViewMode.GRID;
    }

    let local_page_size = Utility.getAttrValue(ATTR_CHAPTER_PAGESIZE, '20', this.itemPrefix);

    if (Utility.isNotBlank(local_page_size)) {
      this.pageSize = PAGE_SIZE_LOOKUP[local_page_size] || 20;
    }

    this.pluginService.getPlugins()
      .pipe(first())
      .subscribe(data => {
        this.actionPlugins = PluginService.filterPlugins(data, 'book', false);
      });

    this.route.params.pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        let bookName = params['book_name'];

        let last_viewed_volume = Utility.getAttrValue(ATTR_CHAPTER_LAST_VOLUME, '', this.itemPrefix, true);

        if (bookName !== last_viewed_volume) {
          this.pageIndex = 0;
          Utility.setAttrValue(ATTR_CHAPTER_LAST_VOLUME, bookName, this.itemPrefix, true);
          Utility.setAttrValue(ATTR_CHAPTER_PAGEINDEX, this.pageIndex.toString(), this.itemPrefix, true);
        } else {
          let local_pageindex = Utility.getAttrValue(ATTR_CHAPTER_PAGEINDEX, '0', this.itemPrefix, true);
          if (Utility.isNotBlank(local_pageindex)) {
            try {
              let temp = parseInt(local_pageindex);
              this.pageIndex = temp;
            } catch (ex) {
              // Ignore
              console.log(ex);
            }
          }
        }

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
              }
            }, complete: () => {

            }, error: error => {
              this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
          }
          );

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

    Utility.setAttrValue(ATTR_CHAPTER_PAGESIZE, this.pageSize.toString(), this.itemPrefix);
    Utility.setAttrValue(ATTR_CHAPTER_PAGEINDEX, this.pageIndex.toString(), this.itemPrefix, true);
  }

  isNewChapter(chapterName: ChapterInfo): boolean {
    return !Utility.isNotBlank(chapterName.value);
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

  switchViewMode(mode: ViewMode) {
    this.mode = mode;
    switch (this.mode) {
      case ViewMode.GRID:
        Utility.setAttrValue(ATTR_CHAPTER_VIEW_MODE, 'G', this.itemPrefix);
        break;
      case ViewMode.LIST:
        Utility.setAttrValue(ATTR_CHAPTER_VIEW_MODE, 'L', this.itemPrefix);
        break;
    }
  }

  formatValue(value: string) {
    if (Utility.isNotBlank(value)) {
      if (value.startsWith('@')) {
        return "Progress: " + value.substring(1) + "%";
      } else {
        return 'Page: #' + value;
      }
    } else {
      return 'Unread';
    }
  }

  gotoChapter(chapter: ChapterInfo) {
    let page = '';
    if (chapter.value) {
      page = chapter.value;
    }
    if (page) {
      if (page.startsWith('@')) {
        page = page.substring(1);
      }
      this.router.navigate(['/a-images', this.selectedBook, chapter.name, this.chapterData.style, page]);
    } else {
      this.router.navigate(['/a-images', this.selectedBook, chapter.name, this.chapterData.style]);
    }
  }
}
