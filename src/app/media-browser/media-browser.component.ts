import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { YyyyMmDdDatePipe } from '../yyyy-mm-dd-date.pipe';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { FileInfo, MediaContainer, MediaFileDefinition, MediaInfo, MediaService } from '../media.service';
import { BOOK_RATINGS_LOOKUP, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP } from '../constants';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Utility } from '../utility';
import { catchError, concatMap, finalize, first, from, of, Subject, takeUntil } from 'rxjs';
import { ActionPlugin, PluginService } from '../plugin.service';
import { FileDownloadService } from '../file-download.service';
import { MediaPlayerTriggerService } from '../media-player-trigger.service';
import { MediaRatingPipe } from '../media-rating.pipe';
import { DropZoneComponent } from "../drop-zone/drop-zone.component";
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-media-browser',
  standalone: true,
  imports: [FormsModule, MediaRatingPipe, MatProgressBarModule, MatDividerModule, CommonModule, RouterModule, MatIconModule, MatPaginatorModule, YyyyMmDdDatePipe, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent, DropZoneComponent],
  templateUrl: './media-browser.component.html',
  styleUrl: './media-browser.component.css'
})
export class MediaBrowserComponent implements OnInit, OnDestroy {
  @ViewChild('scrollToTop') scrollToTop!: ElementRef;

  isLoading: boolean = false;

  //is_dropping: boolean = false;

  sortingMode: string = 'AZ';

  mediaInfo: MediaInfo = { info: { name: '', active: false, preview: false, created: '20050101', info_url: '', parent: '', rating: 0 }, folders: [], files: [], paging: { offset: 0, total: 0 } }

  items: MediaContainer[] = [];
  filtered: MediaContainer[] = [];
  pagedItems: MediaContainer[];

  current_folder_id: string = "";

  rating_blur: number = 0;
  rating_limit: number = 0;
  filter_text: string = '';

  can_media_plugin: boolean = false;
  can_manage: boolean = false;
  active_only: boolean = false;
  can_bookmark: boolean = false;
  filter_max: number = 0;

  totalItems: number = 0;
  pageSize: number = DEFAULT_ITEM_LIMIT;
  pageIndex: number = 0;

  numberOfColumns: number = 1;

  has_selection: boolean = false;
  in_selection_mode: boolean = false;

  private itemPrefix: string = '';

  private ATTR_PAGESIZE = 'media_page_size';
  private ATTR_RATING_LIMIT = 'media_rating_limit';
  private ATTR_RATING_BLUR = 'media_rating_blur';
  private ATTR_SORTING = 'media_sorting';
  private ATTR_ACTIVE_ONLY = 'media_active_only';

  folderPlugins: ActionPlugin[] = [];
  filePlugins: ActionPlugin[] = [];

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  constructor(private triggerMediaPlayer: MediaPlayerTriggerService, private downloadService: FileDownloadService, private router: Router, private mediaService: MediaService, private authService: AuthService, private pluginService: PluginService, private route: ActivatedRoute, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {

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

    this.pluginService.getPlugins()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.folderPlugins = PluginService.filterPlugins(data, 'media_folder', false);
        this.filePlugins = PluginService.filterPlugins(data, 'media_file', false);
      });

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.filter_max = data.session.limits.media || 0;
      this.can_manage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_MEDIA);
      this.can_bookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.can_media_plugin = this.authService.isFeatureEnabled(this.authService.features.MEDIA_PLUGINS);
      this.itemPrefix = data.session.username;
    });

    if (Utility.getAttrValue(this.ATTR_ACTIVE_ONLY, '', this.itemPrefix)) {
      this.active_only = true;
    }

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

    this.pageIndex = 0;

    this.sortingMode = Utility.getAttrValue(this.ATTR_SORTING, 'AZ', this.itemPrefix);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.current_folder_id = params['folder_id'] || '';

      this.refreshFiles();

    });

  }

  refreshPage() {
    this.refreshFiles(this.pageIndex * this.pageSize);
  }

  refreshFiles(offset: number = 0) {
    this.isLoading = true;
    this.has_selection = false;
    this.in_selection_mode = false;

    this.mediaService.fetchMedia(this.current_folder_id, this.rating_limit, this.filter_text, offset, this.pageSize, this.sortingMode).pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.mediaInfo = data;
      this.applyFilter();
    });
  }

  applyFilter() {
    let temp_folders: MediaContainer[] = [];
    let temp_files: MediaContainer[] = [];

    for (let folder of this.mediaInfo.folders) {
      let temp: MediaContainer = {
        is_folder: true,
        name: folder.name,
        id: folder.id,
        created: folder.created,
        updated: folder.updated,
        folder: folder,
        file: undefined,
        filesize: 0,
      }
      temp_folders.push(temp);
    }

    for (let file of this.mediaInfo.files) {
      let temp: MediaContainer = {
        is_folder: false,
        name: file.name,
        id: file.id,
        created: file.created,
        updated: file.updated,
        folder: undefined,
        file: file,
        filesize: file.filesize,
      }
      temp_files.push(temp);
    }

    this.items = temp_folders.concat(temp_files);

    this.totalItems = this.mediaInfo.paging.total;
    this.pageIndex = this.mediaInfo.paging.offset / this.pageSize;

    this.pagedItems = this.items
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
    }

    this.scrollToTop.nativeElement.scrollTop = 0;

    this.refreshFiles(this.pageIndex * this.pageSize);
  }

  changeSort(mode: string) {
    this.sortingMode = mode;
    Utility.setAttrValue(this.ATTR_SORTING, mode, this.itemPrefix);

    this.scrollToTop.nativeElement.scrollTop = 0;

    this.refreshFiles(0);
  }

  toggleActive() {
    this.active_only = !this.active_only;
    if (this.active_only) {
      Utility.setAttrValue(this.ATTR_ACTIVE_ONLY, "true", this.itemPrefix);
    } else {
      Utility.removeAttrValue(this.ATTR_ACTIVE_ONLY, this.itemPrefix);
    }
    //this.applyFilter();
  }

  getBlurImageClass(rating: number, is_folder: boolean = false): string {
    if (rating > this.rating_blur) {
      return is_folder ? 'folder-image blured' : 'cover-image blured';
    }
    return is_folder ? 'folder-image' : 'cover-image';
  }

  // Sorting

  getClassForSort(value: string) {
    if (value == this.sortingMode) {
      return 'sort-selected';
    }
    return '';
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
    this.refreshFiles(0);
  }

  startTextFilter() {
    let filterText = window.prompt("Name Filter", '');
    if (filterText) {
      this.filter_text = filterText.toLowerCase();
    } else {
      this.filter_text = '';
    }
    this.refreshFiles(0);
  }

  handleItemClicked(item: MediaContainer) {
    if (item.is_folder && item.folder) {
      this.router.navigate(['/a-media', 'browse', item.id])
    } else if (!item.is_folder && item.file) {
      if (this.in_selection_mode) {
        this.toggleFile(item);
      } else if (item.file.mime_type.startsWith("video") || item.file.mime_type.startsWith("audio") || item.file.mime_type.startsWith("image")) {
        this.playFile(item.file);
      } else {
        this._snackBar.open('No available action', undefined, {
          duration: 3000
        });
      }
    }
  }

  newFolder() {
    if (this.current_folder_id) {
      this.router.navigate(['/a-media', 'new', 'subfolder', this.current_folder_id]);
    } else {
      this.router.navigate(['/a-media', 'new', 'folder']);
    }
  }

  editFolder() {
    if (this.current_folder_id) {
      this.router.navigate(['/a-media', 'edit', this.current_folder_id]);
    }
  }

  deleteFolder() {
    if (confirm('Are you sure, delete folder?')) {
      this.mediaService.deleteFolder(this.current_folder_id)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              // Jump back to the parent
              if (this.mediaInfo.info.parent) {
                this.router.navigate(['/a-media', 'browse', this.mediaInfo.info.parent]);
              } else {
                // Fallback to root
                this.router.navigate(['/a-media']);
              }
            }
          }, error: error => {
            // Display the error handled by `handleCommonError`
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  deleteSelected() {
    let selected: FileInfo[] = [];

    for (let item of this.pagedItems) {
      if (item.selected && item.file) {
        selected.push(item.file);
      }
    }

    if (selected.length == 1) {
      this.deleteFile(selected[0]);
    } else if (selected.length > 1) {
      this.deleteFiles(selected);
    }
  }

  deleteFile(file: FileInfo) {
    if (confirm('Are you sure, delete ' + file.name + ' file?')) {
      this.mediaService.deleteFile(file.id)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              if (data.message) {
                this._snackBar.open(data.message, undefined, {
                  duration: 2000
                });
              }
              // Remove that item from both lists
              this.refreshPage();
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  migrateFile(file: FileInfo) {
    if (confirm('Are you sure, migrate ' + file.name + ' file to the other drive?')) {
      this.mediaService.migrateFile(file.id)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              if (data.message) {
                this._snackBar.open(data.message, undefined, {
                  duration: 2000
                });
              }
              // Remove that item from both lists
              this.refreshPage();
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  deleteFiles(files: FileInfo[]) {
    const confirmDelete = confirm(`Are you sure you want to delete ${files.length} files?`);
    if (confirmDelete) {
      from(files).pipe(
        concatMap(file =>
          this.mediaService.deleteFile(file.id).pipe(
            first(),
            catchError(error => {
              const errorMessage = error?.message || `Failed to delete file ${file.name}`;
              this._snackBar.open(errorMessage, undefined, { duration: 3000 });
              return of(null); // Continue to the next file even if this one fails
            })
          )
        )
      ).subscribe({
        complete: () => {
          this._snackBar.open('All files processed', undefined, { duration: 2000 });
          this.refreshPage();
        },
        error: error => {
          // Display the error handled by `handleCommonError`
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
    }
  }

  downloadFile(file: FileInfo) {
    this.downloadService.postForFileDownload("/api/media/download", { "file_id": file.id });
  }

  playFile(requested_file: FileInfo) {
    let foundIndex = 0;
    let temp: FileInfo[] = [];
    let current_index = 0;
    for (let file of this.mediaInfo.files) {
      if (file.mime_type.startsWith('video') || file.mime_type.startsWith('audio') || file.mime_type.startsWith('image')) {
        if (file.id == requested_file.id) {
          foundIndex = current_index;
        }
        temp.push(file);
        current_index++;
      }
    }

    this.triggerMediaPlayer.openMediaPlayerComponent({ files: temp, start_index: foundIndex });
  }

  dragOver(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    //this.is_dropping = true;
  }

  dragLeave(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    //this.is_dropping = false;
  }

  handleFileDrop(event: DragEvent) {
    this.dragLeave(event);
    if (this.can_manage && this.current_folder_id) {
      // Get the files from the drop event
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.uploadFilesForFolder(files);
      }
    }
  }

  uploadFilesForFolder(fileList: FileList) {
    const files = Array.from(fileList); // Convert FileList to File[]

    this.isLoading = true;

    from(files).pipe(
      concatMap(file =>
        this.mediaService.uploadFileForFolder(this.current_folder_id, file)
          .pipe(first())
      ),
      finalize(() => this.refreshPage()) // Refresh page after all uploads complete
    ).subscribe(result => {
      if (result.status === 'OK') {
        console.log('File uploaded successfully:', result);
      } else {
        console.error('File upload failed:', result);
      }
    });
  }

  toggleFile(item: MediaContainer) {
    item.selected = !(item.selected);

    for (let item of this.pagedItems) {
      if (item.selected) {
        this.has_selection = true;
        return;
      }
    }

    this.has_selection = false;
  }

  toggleSelectionMode() {
    this.in_selection_mode = !this.in_selection_mode;
  }

  getProgressFromFile(file: FileInfo): number {
    if (file.progress) {
      return parseFloat(file.progress);
    } else {
      return 0;
    }
  }
}
