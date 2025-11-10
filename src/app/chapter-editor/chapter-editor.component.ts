import { Component, OnInit, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChapterFileItem, ChapterFilesData, FilesData, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { DecimalPipe } from '@angular/common';
import { catchError, concatMap, first, from, of, Subject, takeUntil } from 'rxjs';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { ImageSplitterComponent } from "../image-splitter/image-splitter.component";
import { ImageMergeComponent } from "../image-merge/image-merge.component";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingService } from '../loading.service';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-chapter-editor',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatToolbarModule, RouterModule, MatCheckboxModule, LoadingSpinnerComponent, MatGridListModule, ImageSplitterComponent, ImageMergeComponent, FormsModule, TranslocoDirective],
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
  selectedStyle: string = "";
  nextChapter: string = '';
  prevChapter: string = '';
  imageCount: number = 0;

  viewMode: number = 0;

  split_image_url: string = '';
  split_mode: boolean = false;
  keepFirst: boolean = true;

  merge_image_url: string = '';
  merge_image_url2: string = '';
  merge_mode: boolean = false;

  numberOfColumns: number = 1;

  imageData: ChapterFilesData = { next: "", prev: "", files: [], sizes: [] };
  imageNotes: Map<string, number> = new Map();

  load_number: number = 0;

  auto_next: boolean = false;

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  constructor(private decimalPipe: DecimalPipe, private authService: AuthService, private volumeService: VolumeService, private route: ActivatedRoute, private router: Router, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver, private noticeService: NoticeService, private loading: LoadingService) {

    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.numberOfColumns = 2;
        } else if (result.breakpoints[Breakpoints.Small]) {
          this.numberOfColumns = 4;
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.numberOfColumns = 6;
        } else if (result.breakpoints[Breakpoints.Large]) {
          this.numberOfColumns = 6;
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this.numberOfColumns = 6;
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

      this.imageData = { next: "", prev: "", files: [], sizes: [] };
      this.selectedBook = bookName;
      this.selectedChapter = chapter_name;

      this.refreshContent();
    });

  }

  refreshContent(change_postfix: boolean = true) {

    this.loading.show('');
    this.is_loading = true;
    this.volumeService.fetchImages(this.selectedBook, this.selectedChapter, true)
      .pipe(first())
      .subscribe({
        next: data => {

          this.imageNotes.clear();

          this.split_mode = false;
          this.merge_mode = false;

          if (change_postfix) {
            this.load_number = new Date().getTime();
          }
          this.is_loading = false;
          this.loading.hide();

          this.nextChapter = data.next;
          this.prevChapter = data.prev;
          this.selectedStyle = data.style;
          this.has_file_selection = false;
          this.imageCount = data.files.length;

          // Convert the data
          let temp: ChapterFilesData = {
            next: data.next,
            prev: data.prev,
            files: [],
            sizes: []
          }
          for (let srcFileName of data.files) {
            temp.files.push({ filename: srcFileName, selected: false });
          }
          for (let srcSize of data.sizes) {
            temp.sizes.push(srcSize);
          }

          this.imageData = temp;

        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      }
      );
  }

  deleteSelected() {
    let selected: string[] = [];

    for (let item of this.imageData.files) {
      if (item.selected) {
        selected.push(item.filename);
      }
    }

    if (selected.length == 1) {
      this.deleteImage(selected[0]);
    } else if (selected.length > 1) {
      this.deleteImages(selected);
    }
  }



  deleteImage(imgName: string) {
    if (confirm('Are you sure, delete ' + imgName + ' image?')) {
      this.is_loading = true;
      this.loading.show('');
      this.volumeService.removeImage(this.selectedBook, this.selectedChapter, imgName)
        .pipe(first())
        .subscribe({
          next: data => {
            if (this.auto_next && this.nextChapter) {
              this.loading.hide();
              this.router.navigate(['/a-volume', 'images-editor', this.selectedBook, this.nextChapter]);
            } else {
              this.refreshContent(false);
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
            this.loading.hide();
          }
        });
    }
  }

  deleteImages(files: string[]) {
    const confirmDelete = confirm(`Are you sure you want to delete ${files.length} images?`);
    this.loading.show();
    if (confirmDelete) {
      const totalCount = files.length;
      from(files).pipe(
        concatMap((file, index) => {
          this.updateDeleteInfo(file, index + 1, totalCount)
          return this.volumeService.removeImage(this.selectedBook, this.selectedChapter, file).pipe(
            first(),
            catchError(error => {
              const errorMessage = error?.message || `Failed to delete image ${file}`;
              this._snackBar.open(errorMessage, undefined, { duration: 3000 });
              return of(null); // Continue to the next file even if this one fails
            })
          );
        })
      ).subscribe({
        complete: () => {
          this._snackBar.open('All images processed', undefined, { duration: 2000 });
          this.refreshContent(false);
        },
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.loading.hide();
        }
      });
    }
  }

  mergeSelected() {
    let selected: number[] = [];
    let i = 0;
    for (let item of this.imageData.files) {
      if (item.selected && i < this.imageData.files.length - 1) {
        selected.push(i);
      }
      i = i + 1;
    }
    if (selected.length == 1) {
      this.mergeImage(selected[0]);
    } else if (selected.length > 1) {
      selected.reverse();
      this.mergeImages(selected);
    }
  }

  mergeImage(index: number) {

    if (index >= 0 && (index + 1) < this.imageData.files.length) {
      this.selectedImage = this.imageData.files[index].filename;
      this.selectedImage2 = this.imageData.files[index + 1].filename;

      this.merge_image_url = "/api/volume/serve_image/" + encodeURIComponent(this.selectedBook) + "/" + encodeURIComponent(this.selectedChapter) + "/" + encodeURIComponent(this.selectedImage) + '?time=' + this.getImageIndex(this.selectedImage);
      this.merge_image_url2 = "/api/volume/serve_image/" + encodeURIComponent(this.selectedBook) + "/" + encodeURIComponent(this.selectedChapter) + "/" + encodeURIComponent(this.selectedImage2) + '?time=' + this.getImageIndex(this.selectedImage2);

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
            this.updateImageIndex(this.selectedImage);
            this.refreshContent()
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }

  }

  mergeImages(indexes: number[]) {
    const confirmDelete = confirm(`Are you sure you want to merge ${indexes.length} images?`);
    if (confirmDelete) {
      this.loading.show();
      const totalCount = indexes.length;
      from(indexes).pipe(
        concatMap((index, i)  =>
        {
          this.updateMoveInfo(index.toString(), i + 1, totalCount)
          return this.volumeService.mergeImage(this.selectedBook, this.selectedChapter, this.imageData.files[index].filename, this.imageData.files[index + 1].filename).pipe(
            first(),
            catchError(error => {
              const errorMessage = error?.message || `Failed to merge image as index ${index}`;
              this._snackBar.open(errorMessage, undefined, { duration: 3000 });
              return of(null); // Continue to the next file even if this one fails
            })
          )
        })
      ).subscribe({
        complete: () => {
          this._snackBar.open('All images processed', undefined, { duration: 2000 });
          for (let index of indexes) {
            this.updateImageIndex(this.imageData.files[index].filename);
          }
          this.refreshContent(false);
        },
        error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.loading.hide();
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
            this.updateImageIndex(this.selectedImage);
            this.refreshContent()
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  has_file_selection: boolean = false;

  toggleFile(item: ChapterFileItem) {
    item.selected = !(item.selected);
    let source = this.imageData.files;

    this.has_file_selection = false;

    for (let item of source) {
      if (item.selected) {
        this.has_file_selection = true;
        return;
      }
    }
  }

  getImageIndex(name: string): number {
    if (this.imageNotes.has(name)) {
      return this.imageNotes.get(name) as number;
    }
    let val = Date.now();
    this.imageNotes.set(name, val);
    return val;
  }

  updateImageIndex(name: string) {
    this.imageNotes.set(name, Date.now());
  }

  toggleFileAfter(index: number) {
    let source = this.imageData.files;
    for (let j = index; j < source.length; j++) {
      source[j].selected = true;
    }
    this.has_file_selection = true;
  }

  autoMergeSelect(): void {
    const files = this.imageData.files;
    const sizes = this.imageData.sizes; // assuming sizes is an array with same index as files

    for (let i = 0; i < files.length - 1;) {
      const currentSize = sizes[i];
      const nextSize = sizes[i + 1];

      // Check if the next image exists and has the same width
      if (currentSize.w === nextSize.w) {
        // Check if the next image is substantially shorter (e.g., less than 50% height)
        if (nextSize.h < currentSize.h * 0.5) {
          // Select the current (taller) image
          files[i].selected = true;

          // Skip the short one and move to the next pair
          i += 2;
          continue;
        }
      }

      // Otherwise, just move to the next image
      i++;
    }

    this.mergeSelected();
  }

  changeViewMode(value: number) {
    this.viewMode = value;
  }

  isImageVisible(index: number): boolean {
    if (this.viewMode == 1) {
      return true;
    } else if (this.viewMode == 0) {
      if (this.imageCount > 8) {
        return index < 4 || index > this.imageCount - 4;
      } else {
        return true;
      }
    } else if (this.viewMode == 2) {
      return index === 0 || index === this.imageCount - 1;
    } else if (this.viewMode == 3) {
      return index === 0;
    } else if (this.viewMode == 4) {
      return index === this.imageCount - 1;
    }
    return false;
  }

  showLoadingOverlay(message: string = '') {
    this.loading.show(message);
  }

  updateDeleteInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_deleting_file', { fileName: fileName, index: index, total: total }));
  }

  updateMoveInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_moving_file', { fileName: fileName, index: index, total: total }));
  }

}
