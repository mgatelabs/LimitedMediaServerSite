import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { BookmarkDefinition, VolumeService } from '../volume.service';
import { DEFAULT_ITEM_LIMIT } from '../constants';
import { AuthService } from '../auth.service';
import { DataService } from '../data.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { catchError, first, of, Subject, takeUntil } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-book-bookmark-listing',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatPaginatorModule, TranslocoDirective, MatFormFieldModule, MatSelectModule, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './book-bookmark-listing.component.html',
  styleUrl: './book-bookmark-listing.component.css'
})
export class BookBookmarkListingComponent implements OnDestroy {

  @ViewChild('scrollToTop') scrollToTop!: ElementRef;

  isLoading: boolean = false;

  selectedBook: string = "";

  items: BookmarkDefinition[] = [];

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  numberOfColumns: number = 1;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private volumeService: VolumeService, private authService: AuthService, private dataService: DataService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.selectedBook = params['book_id'] || '';
      this.refreshData();
    });

  }

  refreshData() {
    this.isLoading = true;

    this.volumeService.fetchBookmarks(this.selectedBook || '')
      .pipe(first())
      .subscribe(
        {
          next: data => {
            this.isLoading = false;
            if (data) {
              this.items = data;
              this.totalItems = this.items.length;
              this.pageIndex = 0;
            } else {
              this.items = []
              this.totalItems = 0;
              this.pageIndex = 0;
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }

  trackSelectionsBy(info: BookmarkDefinition): string {
    return info.book + "_" + info.chapter + "_" + info.page;
  }

  get pagedItems(): BookmarkDefinition[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.items.length);
    return this.items.slice(startIndex, endIndex);
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.scrollToTop.nativeElement.scrollTop = 0;
  }

  getPageMode(item: BookmarkDefinition) {
    if (item.progress) {
      return "scroll";
    }
    return "page";
  }

  removeBookmark(bookmark: BookmarkDefinition) {
    this.volumeService.removeBookmark(bookmark.id)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data) {
            if (data.message) {
              this._snackBar.open(data.message, undefined, {
                duration: 3000
              });
            }
            this.refreshData();
          }
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
  }
}
