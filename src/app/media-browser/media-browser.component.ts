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
import { FileInfo, FileRefInfo, MediaContainer, MediaInfo, MediaService } from '../media.service';
import { ATTR_MEDIA_PAGESIZE, ATTR_MEDIA_RATING_BLUR, ATTR_MEDIA_RATING_LIMIT, ATTR_MEDIA_SORTING, ATTR_MEDIA_VIEW_MODE, BOOK_RATINGS_LOOKUP, DEFAULT_ITEM_LIMIT, PAGE_SIZE_LOOKUP, VOLUME_VIEW_MODE_LOOKUP } from '../constants';
import { AuthService } from '../auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Utility } from '../utility';
import { catchError, concatMap, finalize, first, from, of, Subject, takeUntil, tap } from 'rxjs';
import { ActionPlugin, PluginService } from '../plugin.service';
import { FileDownloadService } from '../file-download.service';
import { MediaPlayerTriggerService } from '../media-player-trigger.service';
import { MediaRatingPipe } from '../media-rating.pipe';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { ViewMode } from './ViewMode';
import { ByteFormatPipe } from '../byte-format.pipe';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-media-browser',
  standalone: true,
  imports: [FormsModule, ByteFormatPipe, MediaRatingPipe, MatProgressBarModule, MatDividerModule, CommonModule, RouterModule, MatIconModule, MatPaginatorModule, YyyyMmDdDatePipe, MatMenuModule, MatToolbarModule, MatGridListModule, LoadingSpinnerComponent, MatListModule, TranslocoDirective],
  templateUrl: './media-browser.component.html',
  styleUrl: './media-browser.component.css'
})
export class MediaBrowserComponent implements OnInit, OnDestroy {
  @ViewChild('scrollToTop') scrollToTop!: ElementRef;
  @ViewChild('primaryToTop', { static: false }) primaryToTop!: ElementRef;
  @ViewChild('altToTop', { static: false }) altToTop!: ElementRef;

  ViewMode = ViewMode;
  mode: ViewMode = ViewMode.GRID;

  show_split_view: boolean = true;

  isLoading: boolean = false;
  loading_message: string = '';

  //is_dropping: boolean = false;

  sortingMode: string = 'AZ';

  primary_mediaInfo: MediaInfo = { info: { name: '', active: false, preview: false, created: '20050101', info_url: '', parent: '', rating: 0 }, folders: [], files: [], paging: { offset: 0, total: 0 } }
  alt_mediaInfo: MediaInfo = { info: { name: '', active: false, preview: false, created: '20050101', info_url: '', parent: '', rating: 0 }, folders: [], files: [], paging: { offset: 0, total: 0 } }

  primary_items: MediaContainer[] = [];
  primary_pagedItems: MediaContainer[];

  alt_items: MediaContainer[] = [];
  alt_pagedItems: MediaContainer[];

  primary_folder_id: string = "";
  selected_file_id: string = "";
  alt_folder_id: string = "";

  rating_blur: number = 0;
  rating_limit: number = 0;
  filter_text: string = '';

  can_media_plugin: boolean = false;
  can_manage: boolean = false;
  active_only: boolean = false;
  can_bookmark: boolean = false;
  filter_max: number = 0;

  primary_totalItems: number = 0;
  primary_pageSize: number = DEFAULT_ITEM_LIMIT;
  primary_pageIndex: number = 0;

  alt_totalItems: number = 0;
  alt_pageSize: number = DEFAULT_ITEM_LIMIT;
  alt_pageIndex: number = 0;

  numberOfColumns: number = 1;

  has_file_selection: boolean = false;
  has_folder_selection: boolean = false;
  in_selection_mode: boolean = false;

  private itemPrefix: string = '';

  folderPlugins: ActionPlugin[] = [];
  filePlugins: ActionPlugin[] = [];
  filesPlugins: ActionPlugin[] = [];

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  constructor(private triggerMediaPlayer: MediaPlayerTriggerService, private downloadService: FileDownloadService, private router: Router, private mediaService: MediaService, private authService: AuthService, private pluginService: PluginService, private route: ActivatedRoute, breakpointObserver: BreakpointObserver, private noticeService: NoticeService) {

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
        this.show_split_view = this.numberOfColumns >= 3;
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
        this.filesPlugins = PluginService.filterPlugins(data, 'media_files', false);
      });

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.filter_max = data.session.limits.media || 0;
      this.can_manage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_MEDIA);
      this.can_bookmark = this.authService.isFeatureEnabled(this.authService.features.BOOKMARKS);
      this.can_media_plugin = this.authService.isFeatureEnabled(this.authService.features.MEDIA_PLUGINS);
      this.itemPrefix = data.session.username;
    });

    let local_rating = Utility.getAttrValue(ATTR_MEDIA_RATING_BLUR, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_rating)) {
      this.rating_blur = BOOK_RATINGS_LOOKUP[local_rating] || 0;
    }

    let local_limit_rating = Utility.getAttrValue(ATTR_MEDIA_RATING_LIMIT, '0', this.itemPrefix);

    if (Utility.isNotBlank(local_limit_rating)) {
      this.rating_limit = BOOK_RATINGS_LOOKUP[local_limit_rating] || 0;
    }

    let local_view_mode = Utility.getAttrValue(ATTR_MEDIA_VIEW_MODE, 'G', this.itemPrefix);

    if (Utility.isNotBlank(local_view_mode)) {
      this.mode = VOLUME_VIEW_MODE_LOOKUP[local_view_mode] || ViewMode.GRID;
    }

    let local_pagesize = Utility.getAttrValue(ATTR_MEDIA_PAGESIZE, '20', this.itemPrefix);

    if (Utility.isNotBlank(local_pagesize)) {
      this.primary_pageSize = PAGE_SIZE_LOOKUP[local_pagesize] || 20;
      this.alt_pageSize = this.primary_pageSize;
    }

    this.primary_pageIndex = 0;

    this.sortingMode = Utility.getAttrValue(ATTR_MEDIA_SORTING, 'AZ', this.itemPrefix);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.primary_folder_id = params['folder_id'] || '';
      this.alt_folder_id = this.primary_folder_id;

      this.refreshFiles();
      if (this.mode == ViewMode.SPLIT && this.primary_folder_id !== this.alt_folder_id) {
        this.refreshFiles(0, false);
      }

    });

  }

  refreshPage(primary: boolean = true) {
    this.refreshFiles(this.primary_pageIndex * this.primary_pageSize, primary);
  }

  refreshFiles(offset: number = 0, primary: boolean = true) {
    this.showLoadingOverlay();
    this.has_file_selection = false;
    this.has_folder_selection = false;
    this.in_selection_mode = false;

    this.mediaService.fetchMedia(primary ? this.primary_folder_id : this.alt_folder_id, this.rating_limit, this.filter_text, offset, this.primary_pageSize, this.sortingMode).pipe(first()).subscribe(data => {
      this.isLoading = false;
      if (this.mode == ViewMode.SPLIT && this.primary_folder_id === this.alt_folder_id) {
        this.primary_mediaInfo = data;
        this.alt_mediaInfo = data;
        this.applyFilter(primary);
        this.applyFilter(!primary);
      } else {
        if (primary) {
          this.primary_mediaInfo = data;
        } else {
          this.alt_mediaInfo = data;
        }
        this.applyFilter(primary);
      }

    });
  }

  applyFilter(primary: boolean = true) {
    let temp_folders: MediaContainer[] = [];
    let temp_files: MediaContainer[] = [];

    let source = primary ? this.primary_mediaInfo : this.alt_mediaInfo;

    for (let folder of source.folders) {
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

    for (let file of source.files) {
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

    if (primary) {
      this.primary_items = temp_folders.concat(temp_files);
      this.primary_totalItems = this.primary_mediaInfo.paging.total;
      this.primary_pageIndex = this.primary_mediaInfo.paging.offset / this.primary_pageSize;
      this.primary_pagedItems = this.primary_items
    } else {
      this.alt_items = temp_folders.concat(temp_files);
      this.alt_totalItems = this.alt_mediaInfo.paging.total;
      this.alt_pageIndex = this.alt_mediaInfo.paging.offset / this.alt_pageSize;
      this.alt_pagedItems = this.alt_items
    }
  }

  onPageChange(event: any, is_primary: boolean = true) {
    // Handle page change event

    if (is_primary) {
      this.primary_pageIndex = event.pageIndex;
      if (this.primary_pageSize != event.pageSize) {
        this.primary_pageIndex = 0;
      }
      this.primary_pageSize = event.pageSize;
      if (this.authService.isLoggedIn()) {
        Utility.setAttrValue(ATTR_MEDIA_PAGESIZE, this.primary_pageSize.toString(), this.itemPrefix);
      }
    } else {
      this.alt_pageIndex = event.pageIndex;
      if (this.alt_pageSize != event.pageSize) {
        this.alt_pageIndex = 0;
      }
      this.alt_pageSize = event.pageSize;
    }

    switch (this.mode) {
      case ViewMode.GRID:
      case ViewMode.LIST: {
        this.scrollToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(this.primary_pageIndex * this.primary_pageSize);
      } break;
      case ViewMode.SPLIT: {
        if (is_primary) {
          this.primaryToTop.nativeElement.scrollTop = 0;
          this.refreshFiles(this.primary_pageIndex * this.primary_pageSize, is_primary);
        } else {
          this.altToTop.nativeElement.scrollTop = 0;
          this.refreshFiles(this.alt_pageIndex * this.alt_pageSize, false);
        }
      } break;
    }
  }

  changeSort(mode: string) {
    this.sortingMode = mode;
    Utility.setAttrValue(ATTR_MEDIA_SORTING, mode, this.itemPrefix);

    switch (this.mode) {
      case ViewMode.GRID:
      case ViewMode.LIST: {
        this.scrollToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0);
      } break;
      case ViewMode.SPLIT: {
        this.primaryToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0, true);
        this.altToTop.nativeElement.scrollTop = 0;
        if (this.primary_folder_id !== this.alt_folder_id) {
          this.refreshFiles(0, false);
        }
      } break;
    }
  }

  getBlurImageClass(rating: number, is_folder: boolean = false): string {
    if (rating > this.rating_blur) {
      return is_folder ? 'folder-image blured' : 'cover-image blured';
    }
    return is_folder ? 'folder-image' : 'cover-image';
  }

  is_item_blured(rating: number) {
    return rating > this.rating_blur;
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
    Utility.setAttrValue(ATTR_MEDIA_RATING_BLUR, this.rating_blur.toString(), this.itemPrefix);
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
    Utility.setAttrValue(ATTR_MEDIA_RATING_LIMIT, this.rating_limit.toString(), this.itemPrefix);

    switch (this.mode) {
      case ViewMode.GRID:
      case ViewMode.LIST: {
        this.scrollToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0);
      } break;
      case ViewMode.SPLIT: {
        this.primaryToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0, true);
        this.altToTop.nativeElement.scrollTop = 0;
        if (this.primary_folder_id !== this.alt_folder_id) {
          this.refreshFiles(0, false);
        }

      } break;
    }
  }

  startTextFilter() {
    let filterText = window.prompt(this.noticeService.getMessage('form.text_filter'), '');
    if (filterText) {
      this.filter_text = filterText.toLowerCase();
    } else {
      this.filter_text = '';
    }

    switch (this.mode) {
      case ViewMode.GRID:
      case ViewMode.LIST: {
        this.scrollToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0);
      } break;
      case ViewMode.SPLIT: {
        this.primaryToTop.nativeElement.scrollTop = 0;
        this.refreshFiles(0, true);
        this.altToTop.nativeElement.scrollTop = 0;
        if (this.primary_folder_id !== this.alt_folder_id) {
          this.refreshFiles(0, false);
        }

      } break;
    }
  }

  handleItemClicked(item: MediaContainer, is_primary: boolean = true) {
    if (item.is_folder && item.folder) {
      if (this.in_selection_mode) {
        if (is_primary) {
          this.toggleFile(item);
        }
      } else if (this.mode == ViewMode.SPLIT) {
        if (!is_primary) {
          this.alt_folder_id = item.id;
        } else {
          this.primary_folder_id = item.id;
        }
        this.refreshFiles(0, is_primary);
      } else {
        this.router.navigate(['/a-media', 'browse', item.id]);
      }
    } else if (!item.is_folder && item.file) {
      if (this.in_selection_mode) {
        if (is_primary) {
          this.toggleFile(item);
        }
      } else if (item.file.mime_type.startsWith("video") || item.file.mime_type.startsWith("audio") || item.file.mime_type.startsWith("image")) {
        this.playFile(item.file, is_primary);
      } else {
        this.noticeService.handleMessage('msgs.no_operation')
      }
    }
  }

  newFolder() {
    if (this.primary_folder_id) {
      this.router.navigate(['/a-media', 'new', 'subfolder', this.primary_folder_id]);
    } else {
      this.router.navigate(['/a-media', 'new', 'folder']);
    }
  }

  editFolder() {
    if (this.primary_folder_id) {
      this.router.navigate(['/a-media', 'edit', this.primary_folder_id]);
    }
  }

  deleteFolder() {
    if (confirm('Are you sure, delete folder?')) {
      this.mediaService.deleteFolder(this.primary_folder_id)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              // Jump back to the parent
              if (this.primary_mediaInfo.info.parent) {
                this.router.navigate(['/a-media', 'browse', this.primary_mediaInfo.info.parent]);
              } else {
                // Fallback to root
                this.router.navigate(['/a-media']);
              }
            }
          }, error: error => {

          }
        });
    }
  }

  deleteSelected() {
    let selected: FileInfo[] = [];

    for (let item of this.primary_pagedItems) {
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
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_delete_file', { 'name': file.name }));
    if (confirmResult) {
      this.mediaService.deleteFile(file.id)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              this.noticeService.handleResponse(data);
              // Remove that item from both lists
              this.refreshPage();
            }
          }, error: error => {

          }
        });
    }
  }

  moveSelected() {
    let selected: FileRefInfo[] = [];

    for (let item of this.primary_pagedItems) {
      if (item.selected && item.file && this.alt_folder_id) {
        selected.push({ id: item.file.id, name: item.file.name, folder: false });
      } else if (item.selected && item.folder) {
        selected.push({ id: item.folder.id, name: item.folder.name, folder: true });
      }
    }

    if (selected.length > 0) {
      this.moveFiles(selected);
    } else {
      this.noticeService.handleMessage('msgs.no_operation');
    }
  }

  moveFiles(files: FileRefInfo[]) {
    const confirmDelete = confirm(this.noticeService.getMessage('msgs.are_sure_move_files', { 'count': files.length }));
    const totalCount = files.length;
    if (confirmDelete) {
      from(files).pipe(
        concatMap((file, index) => {
          this.updateMoveInfo(file.name, index + 1, totalCount)
          if (file.folder) {
            return this.mediaService.moveFolder(file.id, this.alt_folder_id).pipe(
              first(),
              catchError(error => {
                return of(null);
              })
            );
          } else {
            return this.mediaService.moveFile(file.id, this.alt_folder_id).pipe(
              first(),
              catchError(error => {
                return of(null);
              })
            );
          }
        }
        )
      ).subscribe({
        complete: () => {
          this.noticeService.handleMessage('msgs.operation_complete');
          this.refreshPage();
          if (this.mode == ViewMode.SPLIT) {
            this.refreshPage(false);
          }
        },
        error: error => {

        }
      });
    }
  }

  getFileSelectionAsCommaList(): string {
    let selected: string[] = [];

    for (let item of this.primary_pagedItems) {
      if (item.selected && item.file) {
        selected.push(item.file.id);
      }
    }

    return selected.join(',');
  }

  migrateSelected() {
    let selected: FileInfo[] = [];

    for (let item of this.primary_pagedItems) {
      if (item.selected && item.file) {
        selected.push(item.file);
      }
    }

    if (selected.length == 1) {
      this.migrateFile(selected[0], true);
    } else if (selected.length > 1) {
      this.migrateFiles(selected, true);
    }
  }

  watchSelected() {
    let selected: FileInfo[] = [];

    for (let item of this.primary_pagedItems) {
      if (item.selected && item.file) {
        selected.push(item.file);
      }
    }

    if (selected.length >= 1) {
      this.watchFiles(selected, true);
    }
  }

  migrateFile(file: FileInfo, force_archive: boolean = false) {
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_migrate_file', { 'name': file.name }));
    if (confirmResult) {
      this.mediaService.migrateFile(file.id, force_archive)
        .pipe(first())
        .subscribe({
          next: data => {
            if (data) {
              this.noticeService.handleResponse(data);
              // Remove that item from both lists
              this.refreshPage();
            }
          }, error: error => {
          }
        });
    }
  }

  migrateFiles(files: FileInfo[], force_archive: boolean = false) {
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_migrate_files', { 'count': files.length }));
    const totalCount = files.length;
    if (confirmResult) {
      from(files).pipe(
        concatMap((file, index) => {
          this.updateArchiveInfo(file.name, index + 1, totalCount)
          return this.mediaService.migrateFile(file.id, force_archive).pipe(
            first(),
            catchError(error => {
              return of(null);
            })
          )
        }
        )
      ).subscribe({
        complete: () => {
          this.noticeService.handleMessage('msgs.operation_complete');
          this.refreshPage();
          if (this.mode == ViewMode.SPLIT) {
            this.refreshPage(false);
          }
        },
        error: error => {
        }
      });
    }
  }

  watchFiles(files: FileInfo[], force_archive: boolean = false) {
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_watched_files', { 'count': files.length }));
    const totalCount = files.length;
    if (confirmResult) {
      from(files).pipe(
        concatMap((file, index) => {
          this.updateWatchedInfo(file.name, index + 1, totalCount)
          return this.mediaService.putProgress(file.id, '98.000').pipe(
            first(),
            catchError(error => {
              return of(null);
            })
          )
        }
        )
      ).subscribe({
        complete: () => {
          this.noticeService.handleMessage('msgs.operation_complete');
          this.refreshPage();
          if (this.mode == ViewMode.SPLIT) {
            this.refreshPage(false);
          }
        },
        error: error => {
        }
      });
    }
  }

  deleteFiles(files: FileInfo[]) {
    const confirmResult = confirm(this.noticeService.getMessage('msgs.are_sure_delete_files', { 'count': files.length }));
    const totalCount = files.length;
    if (confirmResult) {
      from(files).pipe(
        concatMap((file, index) => {
          this.updateDeleteInfo(file.name, index + 1, totalCount)
          return this.mediaService.deleteFile(file.id).pipe(
            first(),
            catchError(error => {
              return of(null); // Continue to the next file even if this one fails
            })
          )
        }
        )
      ).subscribe({
        complete: () => {
          this.noticeService.handleMessage('msgs.operation_complete');
          this.refreshPage();
          if (this.mode == ViewMode.SPLIT) {
            this.refreshPage(false);
          }
        },
        error: error => {
        }
      });
    }
  }

  downloadFile(file: FileInfo) {
    this.downloadService.postForFileDownload("/api/media/download/" + file.id, {});
  }

  playFile(requested_file: FileInfo, is_primary: boolean = true) {
    let foundIndex = 0;
    let temp: FileInfo[] = [];
    let current_index = 0;
    let source = is_primary ? this.primary_mediaInfo : this.alt_mediaInfo;
    for (let file of source.files) {
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

  handleFileDrop(event: DragEvent, alt_folder: boolean = false) {
    this.dragLeave(event);
    if (this.can_manage) {
      let dest_folder = alt_folder ? this.alt_folder_id : this.primary_folder_id;
      if (dest_folder) {
        //console.log('Starting upload process to ' + (alt_folder ? 'alt' : 'primary'));
        // Get the files from the drop event
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          this.uploadFilesForFolder(files, dest_folder, alt_folder);
        }
      }
    }
  }

  showLoadingOverlay(message: string = '') {
    this.loading_message = message;
    this.isLoading = true;
  }

  updateUploadInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_uploading_file', { fileName: fileName, index: index, total: total }));
  }

  updateDeleteInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_deleting_file', { fileName: fileName, index: index, total: total }));
  }

  updateArchiveInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_archiving_file', { fileName: fileName, index: index, total: total }));
  }

  updateWatchedInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_archiving_file', { fileName: fileName, index: index, total: total }));
  }

  updateMoveInfo(fileName: string, index: number, total: number) {
    this.showLoadingOverlay(this.noticeService.getMessage('msgs.info_moving_file', { fileName: fileName, index: index, total: total }));
  }

  uploadFilesForFolder(fileList: FileList, dest_folder: string, alt_folder: boolean) {
    const files = Array.from(fileList); // Convert FileList to File[]
    const totalCount = files.length;
    this.showLoadingOverlay();

    from(files).pipe(
      concatMap((file, index) => {
        // Update status before starting the upload
        this.updateUploadInfo(file.name, index + 1, totalCount)

        return this.mediaService.uploadFileForFolder(dest_folder, file).pipe(first());
      }
      ),
      finalize(() => this.refreshPage(!alt_folder)) // Refresh page after all uploads complete
    ).subscribe(result => {
      if (result.status === 'OK') {
        //console.log('File uploaded successfully:', result);
      } else {
        console.error('File upload failed:', result);
      }
    });
  }

  toggleFile(item: MediaContainer, primary: boolean = true) {
    item.selected = !(item.selected);
    let source = primary ? this.primary_pagedItems : this.alt_pagedItems;

    this.has_file_selection = false;
    this.has_folder_selection = false;

    for (let item of source) {
      if (item.selected) {
        if (item.file) {
          this.has_file_selection = true;
        } else {
          this.has_folder_selection = true;
        }
        if (this.has_file_selection && this.has_folder_selection) {
          return;
        }
      }
    }
  }

  toggleSelectionMode() {
    this.in_selection_mode = !this.in_selection_mode;
    for (let item of this.primary_pagedItems) {
      item.selected = false;
    }
    this.has_file_selection = false;
    this.has_folder_selection = false;
  }

  getProgressFromFile(file: FileInfo): number {
    if (file.progress) {
      return parseFloat(file.progress);
    } else {
      return 0;
    }
  }

  switchViewMode(mode: ViewMode) {
    this.mode = mode;

    if (this.mode == ViewMode.SPLIT) {
      this.alt_folder_id = this.primary_folder_id;
      this.refreshFiles(0, false);
    }

    switch (this.mode) {
      case ViewMode.GRID:
        Utility.setAttrValue(ATTR_MEDIA_VIEW_MODE, 'G', this.itemPrefix);
        break;
      case ViewMode.LIST:
        Utility.setAttrValue(ATTR_MEDIA_VIEW_MODE, 'L', this.itemPrefix);
        break;
      case ViewMode.SPLIT:
        Utility.setAttrValue(ATTR_MEDIA_VIEW_MODE, 'S', this.itemPrefix);
        break;
    }
  }

  navigateToParent(primary: boolean = true) {
    if (primary) {
      this.primary_folder_id = this.primary_mediaInfo.info.parent;
    } else {
      this.alt_folder_id = this.alt_mediaInfo.info.parent;
    }
    this.refreshFiles(0, primary);
  }

  getItemPreviewSrc(item: MediaContainer) {
    if (item.folder) {
      if (!item.folder.preview) {
        return "/assets/tile-icon-folder.png";
      }
    } else if (item.file) {
      if (!item.file.preview) {
        return "/assets/tile-icon-file.png";
      }
    }
    return "/api/media/item/preview/" + item.id
  }

  updateSelectedFileId(file_id: string) {
    this.selected_file_id = file_id;
  }

  getPluginName(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.name', {}, plugin.name)
    }
    return plugin.name;
  }

  getPluginTitle(plugin: ActionPlugin) {
    if (plugin.prefix_lang_id) {
      return this.noticeService.getMessageWithDefault('plugins.' + plugin.prefix_lang_id + '.title', {}, plugin.name)
    }
    return '';
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
        this.noticeService.handleMessage('msgs.operation_complete');
      }).catch(err => {
        console.error('Failed to copy:', err);
        this.noticeService.handleMessage('msgs.no_operation');
      });
    }
  }

  isUnread(item: MediaContainer): boolean {
    return (item.file !== undefined && item.file.progress === '0');
  }
}
