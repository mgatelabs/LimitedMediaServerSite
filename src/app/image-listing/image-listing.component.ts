import { Component, OnInit, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FilesData, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { first, Subject, takeUntil } from 'rxjs';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { TranslocoDirective } from '@jsverse/transloco';
import { ImageStateNumberService } from '../image-state-number.service';

@Component({
  selector: 'app-image-listing',
  standalone: true,
  imports: [MatProgressBarModule, AsyncPipe, MatIconModule, MatMenuModule, MatToolbarModule, RouterModule, LoadingSpinnerComponent, TranslocoDirective],
  templateUrl: './image-listing.component.html',
  styleUrl: './image-listing.component.css'
})
export class ImageListingComponent implements OnInit, OnDestroy {

  @ViewChild('scrollableDiv') scrollableDiv: ElementRef;

  is_loading: boolean = false;

  savedPositionX = 0;
  savedPositionY = 0;

  viewPositionX = 0;
  viewPositionY = 1;

  imageData: FilesData = { next: "", prev: "", files: [], sizes: [], style: 'page' };
  selectedBook: string = "";
  selectedChapter: string = "";
  selectedImageName: string = "";
  nextImageName: string = "";
  selectedIndex: number = 0;
  selectedMode: string = 'page';
  nextChapter: string = '';
  prevChapter: string = '';
  imageCount: number = 0;

  loadedToCheck: boolean = false;
  loadedTarget: number = 0;
  loadToTarget: boolean = false;
  loadedCount: number = 0;
  loadedStep: number = 0;
  loadedInterval: any = undefined;

  currentPercent: number = 0;

  singleMode: boolean = true;

  can_bookmark: boolean = false;
  can_manage: boolean = false;

  imageNumber$ = this.imageStateNumberService.stateNumber$;

  constructor(
    private decimalPipe: DecimalPipe,
    private authService: AuthService,
    private volumeService: VolumeService,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private readonly imageStateNumberService: ImageStateNumberService
  ) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    if (this.loadedInterval !== undefined) {
      clearInterval(this.loadedInterval);
      this.loadedInterval = undefined;
    }
    this.stopScroll();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.stopScroll();
    }
  }

  ngOnInit() {

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.can_bookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.can_manage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_VOLUME);
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let bookName = params['book_name'];
      let chapter_name = params['chapter_name'];
      let mode = params['mode'];
      let page = params['page'];
      // You can use this.bookName here in your component logic
      if (this.selectedBook === bookName && this.selectedChapter == chapter_name && this.selectedMode == mode) {
        // Already good
      } else {
        this.stopScroll();

        this.imageData = { next: "", prev: "", files: [], sizes: [], style: 'page' };
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
                this.loadedStep = 0;
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
                  this.viewPositionX = 0;
                  this.savedPositionX = this.loadedTarget;
                } else {
                  this.selectedIndex = parseInt(page);
                }
              } else {
                this.viewPositionX = 0;
                this.savedPositionX = 0;
              }

              if (this.selectedIndex >= data.files.length) {
                this.selectedIndex = data.files.length - 1;
              }
              this.selectedImageName = data.files[this.selectedIndex];
              if (this.selectedIndex + 1 < data.files.length) {
                this.nextImageName = data.files[this.selectedIndex + 1];
              } else {
                this.nextImageName = '';
              }
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
    this.selectedImageName = imageName;
    this.selectedIndex = index;
  }

  updateProgress() {
    this.currentPercent = ((this.selectedIndex + 1) / this.imageData.files.length) * 100.0;
  }

  nextImage() {
    if (this.selectedIndex + 1 < this.imageData.files.length) {
      this.selectedImageName = '';
      this.selectedIndex = this.selectedIndex + 1;
      this.selectedImageName = this.imageData.files[this.selectedIndex];

      if (this.selectedIndex + 1 < this.imageData.files.length) {
        this.nextImageName = this.imageData.files[this.selectedIndex + 1];
      } else {
        this.nextImageName = '';
      }

      this.updateProgress();
    } else if (this.imageData.next) {
      this.router.navigate(['a-volume', 'images', this.selectedBook, this.imageData.next, this.selectedMode]);
    }
  }

  previousImage() {
    if (this.selectedIndex - 1 >= 0) {
      this.selectedImageName = '';
      this.selectedIndex = this.selectedIndex - 1;
      this.selectedImageName = this.imageData.files[this.selectedIndex];

      //if (this.selectedIndex + 1 < this.imageData.files.length) {
      //  this.nextImageName = this.imageData.files[this.selectedIndex];
      //} else {
      this.nextImageName = '';
      //}

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

          let currentPosition = this.getScrollPosition();

          this.viewPositionX = currentPosition;

          if (this.loadedStep % 7 == 0 && this.loadedStep > 0) {
            this.savedPositionX = currentPosition;
            let page = "@" + this.decimalPipe.transform(currentPosition, '1.4-4');
            this.volumeService.uploadProgress(this.selectedBook, this.selectedChapter, page)
              .pipe(first())
              .subscribe();
            this.loadedStep = 0;
          } else {
            this.loadedStep += 1;
          }
        }, 1000);
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

  // Auto Wake

  private wakeLock?: WakeLockSentinel;

  private async acquireWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API not supported');
      return;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = undefined;
      });
    } catch (err) {
      console.warn('Failed to acquire wake lock', err);
    }
  }

  private async releaseWakeLock(): Promise<void> {
    try {
      await this.wakeLock?.release();
    } catch {
      // ignore
    } finally {
      this.wakeLock = undefined;
    }
  }

  // Auto Scroll

  private scrollIntervalId: any | undefined;


  async startScroll(pixelsPerSecond: number): Promise<void> {
    this.stopScroll(); // stop any existing scroll

    if (!this.scrollableDiv) {
      console.warn('Scroll container not ready');
      return;
    }

    await this.acquireWakeLock();

    const intervalDelay = 20; // ms
    const pixelsPerTick:number = (pixelsPerSecond * intervalDelay) / 1000;

    let buildUp:number = 0;

    this.scrollIntervalId = window.setInterval(() => {
      const container = this.scrollableDiv?.nativeElement;
      if (!container) {
        this.stopScroll();
        return;
      }
      
      buildUp += pixelsPerTick;
      if (buildUp > 1.0) {
        let intValue = Math.floor(buildUp);
        // Save the decimal
        buildUp = buildUp % 1;
        container.scrollTop += intValue;
      }      

      // Detect end of scroll
      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 1;

      if (atBottom) {
        this.stopScroll();
      }
    }, intervalDelay);
  }

  stopScroll(): void {
    if (this.scrollIntervalId !== undefined) {
      clearInterval(this.scrollIntervalId);
      this.scrollIntervalId = undefined;
    }

    this.releaseWakeLock();
  }

}
