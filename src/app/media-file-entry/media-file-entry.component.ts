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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { ByteFormatPipe } from '../byte-format.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ActionPlugin, PluginRunResult, PluginService } from '../plugin.service';
import { StatusData } from '../process.service';
import { ProcessMonitorComponent } from '../process-monitor/process-monitor.component';

@Component({
  selector: 'app-media-file-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, FormsModule, MatToolbarModule, MatIconModule, MatSelectModule, MatCardModule, MatButtonModule, TranslocoDirective, ProcessMonitorComponent],
  templateUrl: './media-file-entry.component.html',
  styleUrl: './media-file-entry.component.css'
})
export class MediaFileEntryComponent implements OnInit, OnDestroy {

  ready: boolean = false;

  is_new: boolean = false;

  file_name: string = '';
  file_mime: string = '';
  file_size: string = '';
  file_archive: boolean = false;
  file_preview: boolean = false;
  file_created: string = '';

  file_id: string = '';
  folder_id: string = '';

  detailsTaskId: number | null = null;
  detailsHtml: SafeHtml | null = null;
  detailsError: string | null = null;
  isLoadingDetails: boolean = false;

  constructor(private mediaService: MediaService, private _snackBar: MatSnackBar, private route: ActivatedRoute, private authService: AuthService, private pluginService: PluginService, private sanitizer: DomSanitizer) {

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
          this.file_size = ByteFormatPipe.formatValue(data.filesize);
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

  loadFileDetails(): void {
    this.isLoadingDetails = true;
    this.detailsHtml = null;
    this.detailsError = null;
    this.detailsTaskId = null;

    const plugin: ActionPlugin = {
      id: 'action.file.details',
      icon: 'info',
      name: 'File Details',
      args: [],
      category: 'File',
      standalone: false,
      prefix_lang_id: ''
    };
    const args = new Map<string, string>([['file_id', this.file_id]]);

    this.pluginService.runActionPlugin(plugin, args)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (result: PluginRunResult) => {
          if (result.task_id) {
            this.detailsTaskId = result.task_id;
          } else {
            this.isLoadingDetails = false;
            this.detailsError = 'Failed to start details task: no task ID returned.';
          }
        },
        error: (err: any) => {
          this.isLoadingDetails = false;
          this.detailsError = err?.message || 'Failed to load file details.';
        }
      });
  }

  onDetailsSuccess(data: StatusData): void {
    this.isLoadingDetails = false;
    this.detailsTaskId = null;

    const mdEntry = data.log.find(l => l.fmt === 'md');
    if (!mdEntry) {
      this.detailsError = 'Details task completed but no markdown content was returned.';
      return;
    }

    try {
      const rawHtml = marked.parse(mdEntry.text, { async: false }) as string;
      const sanitized = DOMPurify.sanitize(rawHtml);
      this.detailsHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
    } catch {
      this.detailsError = 'Failed to render file details.';
    }
  }

  onDetailsFailure(data: StatusData): void {
    this.isLoadingDetails = false;
    this.detailsTaskId = null;
    this.detailsError = data.description || 'File details task failed.';
  }

  resetDetails(): void {
    this.detailsHtml = null;
    this.detailsError = null;
    this.detailsTaskId = null;
    this.isLoadingDetails = false;
  }

}
