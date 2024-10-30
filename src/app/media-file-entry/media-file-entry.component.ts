import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaService } from '../media.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { catchError, first, of, Subject, takeUntil } from 'rxjs';
import { Utility } from '../utility';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-media-file-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, FormsModule, MatToolbarModule, MatIconModule, MatSelectModule],
  templateUrl: './media-file-entry.component.html',
  styleUrl: './media-file-entry.component.css'
})
export class MediaFileEntryComponent implements OnInit, OnDestroy {

  ready: boolean = false;

  is_new: boolean = false;

  file_name: string = '';
  file_mime: string = '';
  file_size: number = 0;
  file_archive: boolean = false;
  file_preview: boolean = false;
  file_created: string = '';

  file_id: string = '';
  folder_id: string = '';

  constructor(private mediaService: MediaService, private _snackBar: MatSnackBar, private route: ActivatedRoute, private authService: AuthService) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let file_id = params['file_id'] || '';
      let folder_id = params['folder_id'] || '';
      if (file_id && folder_id) {

        this.file_id = file_id;
        this.folder_id = folder_id;

        this.mediaService.fetchFile(this.file_id).pipe(first()).subscribe(data => {
          this.ready = true;

          this.file_name = data.filename;
          this.file_mime = data.mime_type;
          this.file_size = data.filesize;
          this.file_archive = data.archive;
          this.file_preview = data.preview;
          this.file_created = data.created;
        });
      }

    }
    );
  }

  updateFile() {

    if (!Utility.isNotBlank(this.file_name)) {
      this._snackBar.open('Name is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (!Utility.isNotBlank(this.file_mime)) {
      this._snackBar.open('MimeType is empty', undefined, {
        duration: 2000
      });
      return;
    }


    this.mediaService.putFile(this.file_id, this.file_name, this.file_mime)
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to update file'; // Use the error message if available
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);  // Return a fallback value or empty observable
        })
      )  
      .pipe(first())      
      .subscribe(data => {
        if (data) {
          this._snackBar.open(data.message || 'File Updated', undefined, {
            duration: 2000
          });
        }
      });

  }

}
