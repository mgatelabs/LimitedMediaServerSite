import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MediaService } from '../media.service';
import { catchError, first, of, Subject, takeUntil } from 'rxjs';
import { GroupDefinition } from '../user.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MediaFolderTagChooserComponent } from "../media-folder-tag-chooser/media-folder-tag-chooser.component";

@Component({
  selector: 'app-media-folder-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatCardModule, FormsModule, MatToolbarModule, MatIconModule, TranslocoDirective, MediaFolderTagChooserComponent],
  templateUrl: './media-folder-entry.component.html',
  styleUrl: './media-folder-entry.component.css'
})
export class MediaFolderEntryComponent implements OnInit, OnDestroy {
  ready: boolean = false;

  is_new: boolean = false;

  folder_name: string = '';
  folder_info_url: string = '';
  folder_tags: string = '';
  folder_active: boolean = true;
  folder_media_level: number = 0;
  folder_gid?: number = undefined;
  folder_fast_tags: number[] = [];
  folder_fast_entry: number[] = [];

  folder_parent_id: string = '';
  folder_id: string = '';

  min_rating: number = 0;
  max_rating: number = 0;

  title: string = 'form.new_folder';

  available_groups: GroupDefinition[] = [];

  isDragOver: boolean = false;

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(private mediaService: MediaService, private _snackBar: MatSnackBar, private route: ActivatedRoute, private router: Router, private authService: AuthService) {

  }

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.mediaService.listGroups().pipe(first()).subscribe(result => {
      this.available_groups = result;
    });

    this.authService.sessionData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.max_rating = data.session.limits.media;
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let parent_id = params['parent_id'] || '';
      let folder_id = params['folder_id'] || '';
      if (parent_id) {
        this.title = 'form.new_sub_folder';

        this.folder_parent_id = parent_id;

        this.mediaService.fetchFolder(this.folder_parent_id).pipe(first()).subscribe(data => {
          this.is_new = true;
          this.ready = true;

          this.folder_name = '';
          this.folder_id = '';
          this.folder_parent_id = data.id;
          this.folder_active = true;
          this.folder_media_level = data.rating;
          this.min_rating = data.rating;
          this.folder_gid = data.group_id;
          this.folder_fast_tags = data.fast_tags;
          this.folder_fast_entry = data.fast_tags;
        });
      } else if (folder_id) {
        this.title = 'form.edit_folder';
        this.folder_id = folder_id;

        this.mediaService.fetchFolder(this.folder_id).pipe(first()).subscribe(data => {
          this.is_new = false;
          this.ready = true;

          this.folder_name = data.name;
          this.folder_id = data.id;
          this.folder_parent_id = data.parent_id;
          this.folder_active = data.active;
          this.folder_media_level = data.rating;
          this.folder_gid = data.group_id;
          this.folder_info_url = data.info_url;
          this.folder_tags = data.tags;
          this.folder_fast_tags = data.fast_tags;
          this.folder_fast_entry = data.fast_tags;

          this.min_rating = data.parent_rating;
        });
      } else {
        this.title = 'form.new_folder';
        this.is_new = true;
        this.ready = true;

        this.folder_name = '';
        this.folder_id = '';
        this.folder_parent_id = '';
        this.folder_active = true;
        this.folder_info_url = '';
        this.folder_media_level = 0;
        this.folder_fast_tags = [];
        this.folder_fast_entry = [];
      }
    });
  }

  isNotBlank(value: string): boolean {
    return value.trim().length > 0;
  }

  updateFolder() {
    if (!this.isNotBlank(this.folder_name)) {
      this._snackBar.open('Name is empty', undefined, { duration: 2000 });
      return;
    }

    this.mediaService.putFolder(this.folder_id, this.folder_name, this.folder_info_url, this.folder_tags, this.folder_fast_tags.join(','), this.folder_media_level, this.folder_active, this.folder_gid)
      .pipe(first(), catchError(error => {
        this._snackBar.open(error?.message || 'Failed to update folder', undefined, { duration: 3000 });
        return of(null);
      }))
      .subscribe(data => {
        if (data && data.message) {
          this._snackBar.open(data.message, undefined, { duration: 2000 });
        }
      });
  }

  createFolder() {
    if (!this.isNotBlank(this.folder_name)) {
      this._snackBar.open('Name is empty', undefined, { duration: 2000 });
      return;
    }

    this.mediaService.postFolder(this.folder_parent_id, this.folder_name, this.folder_info_url, this.folder_tags, this.folder_fast_tags.join(','), this.folder_media_level, this.folder_active, this.folder_gid)
      .pipe(first(), catchError(error => {
        this._snackBar.open(error?.message || 'Failed to create folder', undefined, { duration: 3000 });
        return of(null);
      }))
      .subscribe(folder_id => {
        if (folder_id) {
          this.router.navigate(['/a-media', 'edit', folder_id]);
        }
      });
  }

  // ── Image upload ─────────────────────────────────────────────────────────────

  triggerFilePicker() {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadImage(file);
      // Reset so the same file can be picked again
      (event.target as HTMLInputElement).value = '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.uploadImage(file);
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (this.is_new) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          this.uploadImage(file);
          return;
        }
      }
    }
  }

  uploadImage(file: File) {
    this.mediaService.uploadPreviewForFolder(this.folder_id, file)
      .pipe(first(), catchError(error => {
        this._snackBar.open(error?.message || 'Failed to upload image', undefined, { duration: 3000 });
        return of(null);
      }))
      .subscribe(data => {
        if (data && data.message) {
          this._snackBar.open(data.message, undefined, { duration: 3000 });
        }
      });
  }

  tagChanged(value: number[]) {
    this.folder_fast_tags = value;
  }
}
