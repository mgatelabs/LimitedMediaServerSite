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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { ImageSplitterComponent } from "../image-splitter/image-splitter.component";
import { ImageMergeComponent } from "../image-merge/image-merge.component";

@Component({
  selector: 'app-chapter-editor',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatToolbarModule, RouterModule, LoadingSpinnerComponent, MatGridListModule, ImageSplitterComponent, ImageMergeComponent],
  templateUrl: './chapter-editor.component.html',
  styleUrl: './chapter-editor.component.css'
})
export class ChapterEditorComponent implements OnInit, OnDestroy {
  @ViewChild('scrollableDiv') scrollableDiv: ElementRef;

  is_loading: boolean = false;

  selectedBook: string = "";
  selectedChapter: string = "";
  selectedImage: string = "";
  selectedImage2: string = "";
  nextChapter: string = '';
  prevChapter: string = '';
  imageCount: number = 0;


  split_image_url: string = '';
  split_mode: boolean = false;
  keepFirst: boolean = true;

  merge_image_url: string = '';
  merge_image_url2: string = '';
  merge_mode: boolean = false;

  numberOfColumns: number = 1;

  imageData: FilesData = { next: "", prev: "", files: [] };

  load_number: number = 0;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  constructor(private decimalPipe: DecimalPipe, private authService: AuthService, private volumeService: VolumeService, private route: ActivatedRoute, private router: Router, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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
          this.numberOfColumns = 4;
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.numberOfColumns = 6;
        } else if (result.breakpoints[Breakpoints.Large]) {
          this.numberOfColumns = 8;
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this.numberOfColumns = 12;
        }
      }
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let bookName = params['book_name'];
      let chapter_name = params['chapter_name'];
      // You can use this.bookName here in your component logic

      this.imageData = { next: "", prev: "", files: [] };
      this.selectedBook = bookName;
      this.selectedChapter = chapter_name;

      this.refreshContent();
    });

  }

  refreshContent(change_postfix: boolean = true) {

    this.is_loading = true;
    this.volumeService.fetchImages(this.selectedBook, this.selectedChapter)
      .pipe(first())
      .subscribe({
        next: data => {

          if (change_postfix) {
            this.load_number = new Date().getTime();
          }
          this.is_loading = false;

          this.nextChapter = data.next;
          this.prevChapter = data.prev;

          this.imageCount = data.files.length;
          this.imageData = data;

        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
  }

  deleteImage(imgName: string) {
    if (confirm('Are you sure, delete ' + imgName + ' image?')) {
      this.is_loading = true;
      this.volumeService.removeImage(this.selectedBook, this.selectedChapter, imgName)
        .pipe(first())
        .subscribe({
          next: data => {
            this.refreshContent(false);
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  mergeImage(index: number) {

    if (index >= 0 && (index + 1) < this.imageData.files.length) {
      this.selectedImage = this.imageData.files[index];
      this.selectedImage2 = this.imageData.files[index + 1];

      this.merge_image_url = "/api/volume/serve_image/" + encodeURIComponent(this.selectedBook) + "/" + encodeURIComponent(this.selectedChapter) + "/" + encodeURIComponent(this.selectedImage) + '?time=' + this.load_number.toString();
      this.merge_image_url2 = "/api/volume/serve_image/" + encodeURIComponent(this.selectedBook) + "/" + encodeURIComponent(this.selectedChapter) + "/" + encodeURIComponent(this.selectedImage2) + '?time=' + this.load_number.toString();

      this.merge_mode = true;
    } else {
      this._snackBar.open('Unable to merge', undefined, { duration: 3000 });
    }
  }

  handleMergeConfirmed(event: { success: boolean }) {
    this.merge_mode = false;

    if (!event.success) {
      return;
    }

    if (confirm('Are you sure, merge ' + this.selectedImage + ' and ' + this.selectedImage2 + '?')) {
      this.is_loading = true;
      this.volumeService.mergeImage(this.selectedBook, this.selectedChapter, this.selectedImage, this.selectedImage2)
        .pipe(first())
        .subscribe({
          next: data => {
            this.refreshContent()
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }

  }

  splitImage(imgName: string, index: number) {
    this.selectedImage = imgName;
    this.keepFirst = index != 0;
    this.split_image_url = "/api/volume/serve_image/" + encodeURIComponent(this.selectedBook) + "/" + encodeURIComponent(this.selectedChapter) + "/" + encodeURIComponent(imgName) + '?time=' + this.load_number.toString();
    this.split_mode = true;
  }

  handleSplitConfirmed(event: { success: boolean, isHorizontal: boolean; keepFirst: boolean; splitPosition: number }) {
    this.split_mode = false;

    if (!event.success) {
      return;
    }

    if (confirm('Are you sure, split ' + this.selectedImage + ' image?')) {
      this.is_loading = true;
      this.volumeService.splitImage(this.selectedBook, this.selectedChapter, this.selectedImage, event.splitPosition, event.isHorizontal, event.keepFirst)
        .pipe(first())
        .subscribe({
          next: data => {
            this.refreshContent()
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }
}
