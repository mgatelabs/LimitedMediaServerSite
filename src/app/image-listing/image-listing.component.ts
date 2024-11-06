import { Component, OnInit, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FilesData, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { DecimalPipe } from '@angular/common';
import { first, Subject, takeUntil } from 'rxjs';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";

@Component({
  selector: 'app-image-listing',
  standalone: true,
  imports: [MatProgressBarModule, MatIconModule, MatMenuModule, MatToolbarModule, RouterModule, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './image-listing.component.html',
  styleUrl: './image-listing.component.css'
})
export class ImageListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollableDiv') scrollableDiv: ElementRef;

  is_loading: boolean = false;

  imageData: FilesData = { next: "", prev: "", files: [] };
  selectedBook: string = "";
  selectedChapter: string = "";
  selectedImage: string = "";
  selectedIndex: number = 0;
  selectedMode: string = 'page';
  nextChapter: string = '';
  prevChapter: string = '';
  imageCount: number = 0;

  loadedToCheck: boolean = false;
  loadedTarget: number = 0;
  loadToTarget: boolean = false;
  loadedCount: number = 0;
  loadedInterval: any = undefined;

  currentPercent: number = 0;

  singleMode: boolean = true;

  constructor(private decimalPipe: DecimalPipe, private authService: AuthService, private volumeService: VolumeService, private route: ActivatedRoute, private router: Router, private _snackBar: MatSnackBar) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    if (this.loadedInterval !== undefined) {
      clearInterval(this.loadedInterval);
      this.loadedInterval = undefined;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let bookName = params['book_name'];
      let chapter_name = params['chapter_name'];
      let mode = params['mode'];
      let page = params['page'];
      // You can use this.bookName here in your component logic
      if (this.selectedBook === bookName && this.selectedChapter == chapter_name && this.selectedMode == mode) {
        // Already good
      } else {
        this.imageData = { next: "", prev: "", files: [] };
        this.selectedBook = bookName;
        this.selectedChapter = chapter_name;
        this.selectedIndex = 0;
        this.nextChapter = '';
        this.prevChapter = '';
        this.selectedMode = mode;
        this.loadToTarget = false;
        this.loadedTarget = 0;

        this.singleMode = this.selectedMode == 'page';

        this.is_loading = true;

        this.volumeService.fetchImages(this.selectedBook, this.selectedChapter)
          .pipe(first())
          .subscribe({
            next: data => {

              this.is_loading = false;

              this.nextChapter = data.next;
              this.prevChapter = data.prev;

              if (this.loadedInterval !== undefined) {
                clearInterval(this.loadedInterval);
                this.loadedInterval = undefined;
              }

              if (!this.singleMode) {
                this.loadedToCheck = true;
              } else {
                this.loadedToCheck = false;
              }

              if (page) {
                if (page.startsWith('@')) {
                  this.loadToTarget = true;
                  this.loadedTarget = parseFloat(page.substring(1));
                } else {
                  this.selectedIndex = parseInt(page);
                }
              }

              this.selectedImage = data.files[this.selectedIndex];
              this.loadedCount = 0;
              this.currentPercent = 0;
              this.imageCount = data.files.length;
              this.imageData = data;

              this.updateProgress();
            }, error: error => {
              this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
          }
          );

      }
    });

  }

  changeSingleImage(imageName: string, index: number) {
    this.selectedImage = imageName;
    this.selectedIndex = index;
  }

  updateProgress() {
    this.currentPercent = ((this.selectedIndex + 1) / this.imageData.files.length) * 100.0;
  }

  nextImage() {
    if (this.selectedIndex + 1 < this.imageData.files.length) {
      this.selectedIndex = this.selectedIndex + 1;
      this.selectedImage = this.imageData.files[this.selectedIndex];

      this.updateProgress();
    } else if (this.imageData.next) {
      this.router.navigate(['a-images', this.selectedBook, this.imageData.next, this.selectedMode]);
    }
  }

  previousImage() {
    if (this.selectedIndex - 1 >= 0) {
      this.selectedIndex = this.selectedIndex - 1;
      this.selectedImage = this.imageData.files[this.selectedIndex];

      this.updateProgress();
    }
  }

  scrollMode() {
    this.singleMode = false;
  }

  getSelectedClass(index: number) {
    if (index == this.selectedIndex) {
      return 'number-item selected';
    }
    return 'number-item'
  }

  getPageDescription() {
    return 'Page ' + (this.selectedIndex + 1) + " of " + this.imageCount;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.previousImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    }
  }

  addBookmark() {
    let pageValue = '@';

    if (this.selectedMode === 'page') {
      pageValue = this.selectedIndex.toString();
    } else {
      pageValue = "@" + this.decimalPipe.transform(this.getScrollPosition(), '1.4-4');
    }

    this.volumeService.addBookmark(this.selectedBook, this.selectedChapter, pageValue)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data['message']) {
            this._snackBar.open(data['message'], undefined, {
              duration: 3000
            });
          }
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
  }

  imageLoaded() {
    this.loadedCount++;
    this.currentPercent = ((this.loadedCount + 1) / this.imageCount) * 100.0;
    if (this.loadedCount >= this.imageCount) {
      if (this.loadToTarget) {
        this.setScrollPosition(this.loadedTarget);
        this.loadToTarget = false;
      }
      if (this.loadedToCheck) {
        this.loadedInterval = setInterval(() => {
          let page = "@" + this.decimalPipe.transform(this.getScrollPosition(), '1.4-4');
          this.volumeService.uploadProgress(this.selectedBook, this.selectedChapter, page)
            .pipe(first())
            .subscribe();
        }, 5000);
      }
    }
  }

  singleImageLoaded() {
    this.volumeService.uploadProgress(this.selectedBook, this.selectedChapter, this.selectedIndex.toString())
      .pipe(first())
      .subscribe();
  }

  getScrollPosition(): number {
    const element = this.scrollableDiv.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    return (scrollTop / scrollHeight) * 100.0;
  }

  setScrollPosition(scrollvalue: number): void {
    const element = this.scrollableDiv.nativeElement;
    const scrollHeight = element.scrollHeight;
    const scrollTop = (scrollvalue / 100.0) * scrollHeight;
    element.scrollTop = scrollTop;
  }

  isAuthorized() {
    return this.authService.isLoggedIn();
  }
}
