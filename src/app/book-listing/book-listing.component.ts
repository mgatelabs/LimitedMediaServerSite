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
import { BookData, BookSearch, VolumeService } from '../volume.service';
import { AuthService } from '../auth.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { BOOK_RATINGS_LOOKUP, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP } from '../constants';
import { YyyyMmDdDatePipe } from '../yyyy-mm-dd-date.pipe';
import { Utility } from '../utility';
import { MatDividerModule } from '@angular/material/divider';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-book-listing',
  standalone: true,
  imports: [FormsModule, MatDividerModule, CommonModule, RouterModule, MatIconModule, MatPaginatorModule, MatFormFieldModule, YyyyMmDdDatePipe, MatSelectModule, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './book-listing.component.html',
  styleUrl: './book-listing.component.css'
})
export class BookListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollToTop') scrollToTop!: ElementRef;

  isLoading: boolean = false;

  sortingMode: string = 'AZ';

  search: BookSearch = {books: [], paging: {offset: 0, total: 0}};
  pagedItems: BookData[] = [];
  selectedBook: string = "";

  showRestricted: boolean = false;
  showNew: boolean = true;
  showInProgress: boolean = true;
  showDone: boolean = false;
  rating_blur: number = 0;
  rating_limit: number = 0;
  filter_text: string = '';

  can_bookmark: boolean = false;
  filter_max: number = 0;

  viewed: Map<string, string> = new Map();

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  numberOfColumns: number = 1;

  private itemPrefix: string = '';

  private ATTR_PAGESIZE = 'book_page_size';
  private ATTR_RATING_LIMIT = 'book_rating_limit';
  private ATTR_RATING_BLUR = 'book_rating_blur';
  private ATTR_PAGEINDEX = 'book_page_index';
  private ATTR_SORTING = 'book_sorting';
  private ATTR_RESTRICTED = 'book_restricted';

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private router: Router, private volumeService: VolumeService, private authService: AuthService, private dataService: DataService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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
      this.filter_max = data.session.limits.volume || 0;
      this.can_bookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.itemPrefix = data.session.username;
    });

    let local_rating = Utility.getAttrValue(this.ATTR_RATING_BLUR, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_rating)) {
      this.rating_blur = BOOK_RATINGS_LOOKUP[local_rating] || 0;
    }

    let local_limit_rating = Utility.getAttrValue(this.ATTR_RATING_LIMIT, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_limit_rating)) {
      this.rating_limit = BOOK_RATINGS_LOOKUP[local_limit_rating] || 0;
    }

    let local_pagesize = Utility.getAttrValue(this.ATTR_PAGESIZE, '20', this.itemPrefix);

    if (Utility.isNotBlank(local_pagesize)) {
      this.pageSize = PAGE_SIZE_LOOKUP[local_pagesize] || 20;
    }

    let local_pageindex = Utility.getAttrValue(this.ATTR_PAGEINDEX, '', this.itemPrefix);

    if (Utility.isNotBlank(local_pageindex)) {
      try {
        let temp = parseInt(local_pageindex);
        this.pageIndex = temp;
      } catch (ex) {
        // Ignore
      }
    }

    this.volumeService.viewedData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.viewed = data;
    });

    this.sortingMode = Utility.getAttrValue(this.ATTR_SORTING, 'AZ', this.itemPrefix);

    // Fetch data from the API using the DataService

    this.isLoading = true;

    this.refreshPage();
  }

  refreshPage() {
    this.refreshBooks(this.pageIndex * this.pageSize);
  } 

  refreshBooks(offset: number = 0) {
    this.isLoading = true;

    this.volumeService.fetchBooks(this.rating_limit, this.filter_text, offset, this.pageSize, this.sortingMode).pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.search = data;
      this.applyFilter();
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
      Utility.setAttrValue(this.ATTR_PAGESIZE, this.pageSize.toString(), this.itemPrefix);
      Utility.setAttrValue(this.ATTR_PAGEINDEX, this.pageIndex.toString(), this.itemPrefix);
    }

    this.refreshBooks(this.pageIndex * this.pageSize);
  }

  changeSort(mode: string) {
    this.sortingMode = mode;
    Utility.setAttrValue(this.ATTR_SORTING, mode, this.itemPrefix);
    this.scrollToTop.nativeElement.scrollTop = 0;

    this.refreshBooks(0);
  }


  isNewChapter(item: BookData): number {
    if (this.viewed.has(item.id)) {
      let latestViewed = this.viewed.get(item.id);
      if (item.last !== latestViewed) {
        return 1;
      } else {
        return 0;
      }
    }
    return -1;
  }

  getCurrentChapter(item: BookData): string {
    if (this.viewed.has(item.id)) {
      let chapter = this.viewed.get(item.id) || '';
      if (chapter.indexOf('^') > 0) {
        let result = this.volumeService.processChapterWithProgress(chapter);
        chapter = result[0];
      }
      return chapter || 'Start';
    }
    return 'Start';
  }

  toggleVisibility() {
    this.showRestricted = !this.showRestricted;
    if (this.showRestricted) {
      Utility.setAttrValue(this.ATTR_RESTRICTED, "true", this.itemPrefix);
    } else {
      Utility.removeAttrValue(this.ATTR_RESTRICTED, this.itemPrefix);
    }

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
    if (this.viewed.has(book.id)) {
      chapter = this.viewed.get(book.id) || '';
    }
    if (chapter.length == 0 && book.first.length > 0) {
      chapter = book.first;
    }
    let page = '';
    if (chapter.indexOf('^') > 0) {
      let result = this.volumeService.processChapterNameWithProgress(chapter);
      chapter = result[0];
      page = result[1];
    }

    if (chapter.length > 0) {
      if (page) {
        if (page.startsWith('@')) {
          page = page.substring(1);
        }
        this.router.navigate(['/a-images', book.id, chapter, book.style, page]);
      } else {
        this.router.navigate(['/a-images', book.id, chapter, book.style]);
      }
    } else {
      this.router.navigate(['/a-book', book.id, 'value2']);
    }
  }

  gotoBookChapters(book: BookData) {
    this.router.navigate(['/a-book', book.id]);
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
    Utility.setAttrValue(this.ATTR_RATING_BLUR, this.rating_blur.toString(), this.itemPrefix);
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
    Utility.setAttrValue(this.ATTR_RATING_LIMIT, this.rating_limit.toString(), this.itemPrefix);
    this.refreshBooks(0);
  }

  startTextFilter() {
    let filterText = window.prompt("Name Filter", '');
    if (filterText) {
      this.filter_text = filterText.toLowerCase();
    } else {
      this.filter_text = '';
    }
    this.refreshBooks(0);
  }
}
