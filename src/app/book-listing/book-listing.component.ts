import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { AsyncPipe, CommonModule } from '@angular/common';
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
import { BookData, BookSearch, ProcessorDefinition, TagSearch, VolumeService } from '../volume.service';
import { BookSearchDialogData, BookSearchDialogResult, ProcessorOption } from '../book-search-dialog/book-search-dialog.types';
import { BookSearchDialogComponent } from '../book-search-dialog/book-search-dialog.component';
import { AuthService } from '../auth.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ATTR_VOLUME_PAGEINDEX, ATTR_VOLUME_PAGESIZE, ATTR_VOLUME_RATING_BLUR, ATTR_VOLUME_RATING_LIMIT, ATTR_VOLUME_SEARCH_PROCESSORS, ATTR_VOLUME_SEARCH_TAGS, ATTR_VOLUME_SEARCH_TEXT, ATTR_VOLUME_SEARCH_TYPE, ATTR_VOLUME_SORTING, ATTR_VOLUME_VIEW_MODE, BOOK_RATINGS_LOOKUP, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP, VOLUME_VIEW_MODE_LOOKUP } from '../constants';
import { YyyyMmDdDatePipe } from '../yyyy-mm-dd-date.pipe';
import { Utility } from '../utility';
import { MatDividerModule } from '@angular/material/divider';
import { first, Subject, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { ViewMode } from '../media-browser/ViewMode';
import { LongPressDirective } from '../long-press.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ImageStateNumberService } from '../image-state-number.service';
import { RecentItemsService, RecentItemType } from '../recent-items.service';
import { HamburgerMenuComponent } from "../hamburger-menu/hamburger-menu.component";
import { PortalModule } from '@angular/cdk/portal';



@Component({
  selector: 'app-book-listing',
  standalone: true,
  imports: [FormsModule, AsyncPipe, MatDividerModule, PortalModule, CommonModule, RouterModule, LongPressDirective, MatIconModule, MatPaginatorModule, MatFormFieldModule, YyyyMmDdDatePipe, MatSelectModule, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent, MatListModule, TranslocoDirective, HamburgerMenuComponent],
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
  filter_type: string = '';
  filter_tags: string[] = [];
  filter_processors: string[] = [];
  dialogTags: string[] | undefined = undefined;
  dialogProcessors: ProcessorOption[] | undefined = undefined;

  can_bookmark: boolean = false;
  can_manage_books: boolean = false;
  filter_max: number = 0;
  filter_active: boolean = false;

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  numberOfColumns: number = 1;

  private itemPrefix: string = '';

  imageNumber$ = this.imageStateNumberService.stateNumber$;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private router: Router,
    private volumeService: VolumeService,
    private authService: AuthService,
    private dataService: DataService,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private readonly imageStateNumberService: ImageStateNumberService,
    private recentSvc: RecentItemsService
  ) {

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
      this.can_manage_books = this.authService.isFeatureEnabled(this.authService.features.MANAGE_VOLUME);
      this.itemPrefix = data.session.username;

      // Eagerly cache the processor list (requires MANAGE_VOLUME) so the dialog
      // has options before it is opened.
      this.loadProcessors();
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

    this.filter_text = Utility.getAttrValue(ATTR_VOLUME_SEARCH_TEXT, '', this.itemPrefix, true);
    this.filter_type = Utility.getAttrValue(ATTR_VOLUME_SEARCH_TYPE, '', this.itemPrefix, true);
    const savedTags = Utility.getAttrValue(ATTR_VOLUME_SEARCH_TAGS, '', this.itemPrefix, true);
    this.filter_tags = savedTags ? JSON.parse(savedTags) : [];
    const savedProcessors = Utility.getAttrValue(ATTR_VOLUME_SEARCH_PROCESSORS, '', this.itemPrefix, true);
    this.filter_processors = savedProcessors ? JSON.parse(savedProcessors) : [];

    this.computeFilterActive();

    // Fetch data from the API using the DataService

    this.isLoading = true;

    this.refreshPage();
  }

  // Drives the hamburger filter icon state, mirroring media-browser.
  computeFilterActive() {
    this.filter_active =
      this.filter_text.length > 0 ||
      this.filter_tags.length > 0 ||
      this.filter_processors.length > 0 ||
      this.filter_type !== '' ||
      this.sortingMode !== 'AZ';
  }

  refreshPage() {
    this.refreshBooks(this.pageIndex * this.pageSize);
  }

  refreshBooks(offset: number = 0, reset_position: boolean = false) {
    this.isLoading = true;

    if (reset_position) {
      this.scrollToTop.nativeElement.scrollTop = 0;
    }

    this.volumeService.fetchBooks(this.rating_limit, this.filter_text, this.filter_tags, offset, this.pageSize, this.sortingMode, this.filter_type, this.filter_processors)
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

  private buildRatingLevels(): Array<{ value: number; label: string }> {
    const levels: Array<{ value: number; label: string }> = [];
    if (this.filter_max >= 0) {
      levels.push({ value: 0, label: 'form.rating_g' });
    }
    if (this.filter_max >= 40) {
      levels.push({ value: 40, label: 'form.rating_pg' });
    }
    if (this.filter_max >= 60) {
      levels.push({ value: 60, label: 'form.rating_pg13' });
    }
    if (this.filter_max >= 80) {
      levels.push({ value: 80, label: 'form.rating_r17' });
    }
    if (this.filter_max >= 90) {
      levels.push({ value: 90, label: 'form.rating_rplus' });
    }
    if (this.filter_max >= 100) {
      levels.push({ value: 100, label: 'form.rating_rx' });
    }
    if (this.filter_max >= 200) {
      levels.push({ value: 200, label: 'form.rating_unrated' });
    }
    return levels;
  }

  // Fetch and cache the processor list. Requires MANAGE_VOLUME; when not cached,
  // optionally notifies an already-open dialog so its late-arriving list renders.
  private loadProcessors(notifyRef?: MatDialogRef<BookSearchDialogComponent, BookSearchDialogResult>) {
    if (!this.can_manage_books || this.dialogProcessors) {
      return;
    }
    this.volumeService.fetchProcessors().pipe(first()).subscribe({
      next: (list: ProcessorDefinition[]) => {
        const options = (list ?? []).map((p: ProcessorDefinition) => ({ value: p.id, name: p.name }));
        this.dialogProcessors = options;
        notifyRef?.componentInstance?.availableProcessorsSig.set(options);
      },
      error: () => {
        // Leave empty; the dialog hides the processors section (retry on next open).
      }
    });
  }

  openSearchDialog(): void {
    const cachedTags = this.dialogTags;
    const cachedProcessors = this.dialogProcessors;

    const data: BookSearchDialogData = {
      availableTags: cachedTags ? [...cachedTags] : [], // filled lazily below if not cached
      processors: cachedProcessors ? [...cachedProcessors] : [], // filled lazily below if not cached
      sortOptions: [
        { value: 'AZ', label: 'form.sort_az' },
        { value: 'ZA', label: 'form.sort_za' },
        { value: 'DA', label: 'form.sort_da' },
        { value: 'DD', label: 'form.sort_dd' },
      ],
      typeOptions: [
        { value: '', label: 'form.type_both' },
        { value: 'P', label: 'form.type_page' },
        { value: 'S', label: 'form.type_scrolling' },
      ],
      blurLevels: this.buildRatingLevels(),
      filterLevels: this.buildRatingLevels(),
      initial: {
        text: this.filter_text,
        tags: this.filter_tags,
        processors: this.filter_processors,
        type: this.filter_type,
        sortOrder: this.sortingMode,
        blurLevel: this.rating_blur,
        filterLevel: this.rating_limit,
      },
    };

    // Open optimistically; tags are fetched in the background and pushed in.
    const dialogRef = this.dialog.open(BookSearchDialogComponent, {
      data,
      width: '700px',
    });

    if (!cachedTags) {
      this.volumeService.fetchTags().pipe(first()).subscribe({
        next: (tagResult: TagSearch) => {
          const list = tagResult.tags ?? [];
          this.dialogTags = list;
          if (dialogRef.componentInstance) {
            dialogRef.componentInstance.availableTagsSig.set(list);
          }
        },
        error: () => {
          // Leave the tag list empty; the dialog renders fine without it.
        },
      });
    }

    if (!cachedProcessors) {
      this.loadProcessors(dialogRef);
    }

    dialogRef.afterClosed().subscribe((result?: BookSearchDialogResult) => {
      if (!result) {
        return; // Cancelled
      }

      this.filter_text = result.text;
      this.filter_tags = result.tags;
      this.filter_processors = result.processors ?? [];
      this.filter_type = result.type;
      this.sortingMode = result.sortOrder;
      this.rating_blur = result.blurLevel;
      this.rating_limit = result.filterLevel;

      // Persist — all of these are per-user globals.
      Utility.setAttrValue(ATTR_VOLUME_SEARCH_TEXT, this.filter_text, this.itemPrefix, true);
      Utility.setAttrValue(ATTR_VOLUME_SEARCH_TYPE, this.filter_type, this.itemPrefix, true);
      Utility.setAttrValue(ATTR_VOLUME_SEARCH_TAGS, JSON.stringify(this.filter_tags), this.itemPrefix, true);
      Utility.setAttrValue(ATTR_VOLUME_SEARCH_PROCESSORS, JSON.stringify(this.filter_processors), this.itemPrefix, true);
      Utility.setAttrValue(ATTR_VOLUME_SORTING, this.sortingMode, this.itemPrefix);
      Utility.setAttrValue(ATTR_VOLUME_RATING_BLUR, this.rating_blur.toString(), this.itemPrefix);
      Utility.setAttrValue(ATTR_VOLUME_RATING_LIMIT, this.rating_limit.toString(), this.itemPrefix);

      this.computeFilterActive();

      this.scrollToTop.nativeElement.scrollTop = 0;
      this.refreshBooks(0, true);
    });
  }

  isDecimal(value: string): boolean {
    return /^-?\d+(\.\d+)?$/.test(value.trim());
  }

  isFinished(item: BookData) {
    if (!item.recent) {
      return false;
    }
    let latest = item.recent.chapter;
    let last = item.last;
    return latest === last;
  }

  isNewish(item: BookData) {
    return (!item.recent);
  }

  calculateBookPercentage(item: BookData): number {

    if (!item.recent) {
      return 0;
    }

    let latest = item.recent.chapter;
    let last = item.last;

    if (this.isDecimal(latest) && this.isDecimal(last)) {
      try {
        let a = parseFloat(latest);
        let b = parseFloat(last);
        return (a / b) * 100.0;
      } catch(ex) {
        console.log(ex);
      }
    }
    return 0;
  }
}
