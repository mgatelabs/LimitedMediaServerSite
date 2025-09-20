import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { BookData, BookSearch, TagSearch, VolumeService } from '../volume.service';
import { AuthService } from '../auth.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ATTR_VOLUME_PAGEINDEX, ATTR_VOLUME_PAGESIZE, ATTR_VOLUME_RATING_BLUR, ATTR_VOLUME_RATING_LIMIT, ATTR_VOLUME_SORTING, ATTR_VOLUME_VIEW_MODE, BOOK_RATINGS_LOOKUP, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP, VOLUME_VIEW_MODE_LOOKUP } from '../constants';
import { YyyyMmDdDatePipe } from '../yyyy-mm-dd-date.pipe';
import { Utility } from '../utility';
import { MatDividerModule } from '@angular/material/divider';
import { first, Subject, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { ViewMode } from '../media-browser/ViewMode';
import { LongPressDirective } from '../long-press.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatDialog } from '@angular/material/dialog';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';


@Component({
  selector: 'app-book-listing',
  standalone: true,
  imports: [FormsModule, MatDividerModule, CommonModule, RouterModule, LongPressDirective, MatIconModule, MatPaginatorModule, MatFormFieldModule, YyyyMmDdDatePipe, MatSelectModule, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent, MatListModule, TranslocoDirective],
  templateUrl: './book-listing.component.html',
  styleUrl: './book-listing.component.css'
})
export class BookListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollToTop') scrollToTop!: ElementRef;

  ViewMode = ViewMode;
  mode: ViewMode = ViewMode.GRID;

  isLoading: boolean = false;

  sortingMode: string = 'AZ';

  search: BookSearch = { books: [], paging: { offset: 0, total: 0 } };
  pagedItems: BookData[] = [];
  selectedBook: string = "";

  showRestricted: boolean = false;
  showNew: boolean = true;
  showInProgress: boolean = true;
  showDone: boolean = false;
  rating_blur: number = 0;
  rating_limit: number = 0;
  filter_text: string = '';
  filter_tags: string[] = [];
  all_tags: string[] = [];
  tagSearch: TagSearch | undefined = undefined;

  can_bookmark: boolean = false;
  filter_max: number = 0;

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  numberOfColumns: number = 1;

  private itemPrefix: string = '';



  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private router: Router, private volumeService: VolumeService, private authService: AuthService, private dataService: DataService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver, private dialog: MatDialog) {

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.numberOfColumns = 1;
        } else if (result.breakpoints[Breakpoints.Small]) {
          this.numberOfColumns = 2;
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.numberOfColumns = 4;
        } else if (result.breakpoints[Breakpoints.Large]) {
          this.numberOfColumns = 6;
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this.numberOfColumns = 8;
        }
      }
    });

  }

  get shouldHidePageSize(): boolean {
    return this.numberOfColumns === 1;
  }

  ngOnInit() {

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.filter_max = data.session.limits.volume || 0;
      this.can_bookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.itemPrefix = data.session.username;
    });

    let local_rating = Utility.getAttrValue(ATTR_VOLUME_RATING_BLUR, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_rating)) {
      this.rating_blur = BOOK_RATINGS_LOOKUP[local_rating] || 0;
    }

    let local_limit_rating = Utility.getAttrValue(ATTR_VOLUME_RATING_LIMIT, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_limit_rating)) {
      this.rating_limit = BOOK_RATINGS_LOOKUP[local_limit_rating] || 0;
    }

    let local_pagesize = Utility.getAttrValue(ATTR_VOLUME_PAGESIZE, '20', this.itemPrefix);

    if (Utility.isNotBlank(local_pagesize)) {
      this.pageSize = PAGE_SIZE_LOOKUP[local_pagesize] || 20;
    }

    let local_view_mode = Utility.getAttrValue(ATTR_VOLUME_VIEW_MODE, 'G', this.itemPrefix);

    if (Utility.isNotBlank(local_view_mode)) {
      this.mode = VOLUME_VIEW_MODE_LOOKUP[local_view_mode] || ViewMode.GRID;
    }

    let local_pageindex = Utility.getAttrValue(ATTR_VOLUME_PAGEINDEX, '', this.itemPrefix, true);

    if (Utility.isNotBlank(local_pageindex)) {
      try {
        let temp = parseInt(local_pageindex);
        this.pageIndex = temp;
      } catch (ex) {
        // Ignore
      }
    }

    this.sortingMode = Utility.getAttrValue(ATTR_VOLUME_SORTING, 'AZ', this.itemPrefix);

    // Fetch data from the API using the DataService

    this.isLoading = true;

    this.refreshPage();
  }

  refreshPage() {
    this.refreshBooks(this.pageIndex * this.pageSize);
  }

  refreshBooks(offset: number = 0, reset_position: boolean = false) {
    this.isLoading = true;

    if (reset_position) {
      this.scrollToTop.nativeElement.scrollTop = 0;
    }

    this.volumeService.fetchBooks(this.rating_limit, this.filter_text, this.filter_tags, offset, this.pageSize, this.sortingMode)
      .pipe(first())
      .subscribe({
        next: data => {
          this.isLoading = false;
          this.search = data;
          this.applyFilter();
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  applyFilter() {
    this.totalItems = this.search.paging.total;
    this.pageIndex = this.search.paging.offset / this.pageSize;
    this.pagedItems = this.search.books;
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    if (this.pageSize != event.pageSize) {
      this.pageIndex = 0;
    }
    this.pageSize = event.pageSize;

    if (this.authService.isLoggedIn()) {
      Utility.setAttrValue(ATTR_VOLUME_PAGESIZE, this.pageSize.toString(), this.itemPrefix);
      Utility.setAttrValue(ATTR_VOLUME_PAGEINDEX, this.pageIndex.toString(), this.itemPrefix, true);
    }

    this.refreshBooks(this.pageIndex * this.pageSize, true);
  }

  changeSort(mode: string) {
    this.sortingMode = mode;
    Utility.setAttrValue(ATTR_VOLUME_SORTING, mode, this.itemPrefix);

    this.refreshBooks(0, true);
  }


  isNewChapter(item: BookData): number {
    if (item.recent) {
      if (item.recent.chapter !== item.last) {
        return 1;
      } else {
        return 0;
      }
    } else {
      return -1;
    }
  }

  getCurrentChapter(item: BookData): string {
    if (item.recent) {
      return item.recent.chapter;
    }
    return 'Start';
  }

  is_item_blured(rating: number) {
    return rating > this.rating_blur;
  }

  getBookImageClass(item: BookData): string {
    if (item.rating > this.rating_blur) {
      return 'cover-image blured';
    } else {
      return 'cover-image';
    }
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

  getClassForSort(value: string) {
    if (value == this.sortingMode) {
      return 'sort-selected';
    }
    return '';
  }

  getClassForOffline() {
    if (this.showRestricted) {
      return 'sort-selected';
    }
    return '';
  }

  getClassForDone() {
    if (this.showDone) {
      return 'sort-selected';
    }
    return '';
  }

  getClassForNew() {
    if (this.showNew) {
      return 'sort-selected';
    }
    return '';
  }

  getClassForInProgress() {
    if (this.showInProgress) {
      return 'sort-selected';
    }
    return '';
  }

  gotoBook(book: BookData) {

    let chapter = book.first;
    let page = '';

    if (book.recent) {
      chapter = book.recent.chapter;
      page = book.recent.value;
    }

    if (chapter.length > 0) {
      if (page) {
        if (page.startsWith('@')) {
          page = page.substring(1);
        }
        this.router.navigate(['/a-volume', 'images', book.id, chapter, book.style, page]);
      } else {
        this.router.navigate(['/a-volume', 'images', book.id, chapter, book.style]);
      }
    } else {
      this.router.navigate(['/a-volume', 'book', book.id]);
    }
  }

  gotoBookChapters(book: BookData) {
    this.router.navigate(['/a-volume', 'book', book.id]);
  }

  // Rate Blur
  getRatingBlurClass(rating: number) {
    if (this.rating_blur == rating) {
      return 'sort-selected';
    }
    return '';
  }

  setRatingBlur(rating: number) {
    this.rating_blur = rating;
    Utility.setAttrValue(ATTR_VOLUME_RATING_BLUR, this.rating_blur.toString(), this.itemPrefix);
  }

  // Rate Limiter

  getRatingLimitClass(rating: number) {
    if (this.rating_limit == rating) {
      return 'sort-selected';
    }
    return '';
  }

  setRatingLimit(rating: number) {
    this.rating_limit = rating;
    Utility.setAttrValue(ATTR_VOLUME_RATING_LIMIT, this.rating_limit.toString(), this.itemPrefix);
    this.refreshBooks(0, true);
  }

  startTextFilter() {
    this.openSearch();

    //let filterText = window.prompt("Name Filter", '');
    //if (filterText) {
    //  this.filter_text = filterText.toLowerCase();
    //} else {
    //  this.filter_text = '';
    //}
    //this.refreshBooks(0, true);
  }

  switchViewMode(mode: ViewMode) {
    this.mode = mode;
    switch (this.mode) {
      case ViewMode.GRID:
        Utility.setAttrValue(ATTR_VOLUME_VIEW_MODE, 'G', this.itemPrefix);
        break;
      case ViewMode.LIST:
        Utility.setAttrValue(ATTR_VOLUME_VIEW_MODE, 'L', this.itemPrefix);
        break;
    }
  }

  openSearch() {
    const loadAndOpenDialog = (tags: string[]) => {
      const dialogRef = this.dialog.open(SearchDialogComponent, {
        width: '100%',
        maxWidth: '500px',
        data: {
          searchText: this.filter_text,
          selectedTags: this.filter_tags,
          allTags: tags, // can be empty initially, fetch lazily
        },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.filter_text = result.text;
          this.filter_tags = result.tags;
          this.refreshBooks(0, true);
          // Trigger your search function
        }
      });
    };

    if (this.tagSearch) {
      // Already loaded
      loadAndOpenDialog(this.tagSearch.tags);
    } else {
      // Lazy load from service
      this.volumeService.fetchTags().subscribe((tagResult: TagSearch) => {
        this.tagSearch = tagResult;
        loadAndOpenDialog(this.tagSearch.tags);
      });
    }
  }
}
