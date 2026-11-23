import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MediaService } from '../media.service';
import { NoticeService } from '../notice.service';
import { Utility } from '../utility';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-media-key-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatToolbarModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, TranslocoDirective, LoadingSpinnerComponent],
  templateUrl: './media-key-entry.component.html',
  styleUrl: './media-key-entry.component.css'
})
export class MediaKeyEntryComponent implements OnInit, OnDestroy {

  folderId: string = '';
  rowId: number | null = null;

  key: string = '';
  value: string = '';
  purpose: number = 1;

  ready: boolean = false;
  isSaving: boolean = false;

  get isEditMode(): boolean {
    return this.rowId !== null;
  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(private mediaService: MediaService, private noticeService: NoticeService, private route: ActivatedRoute, private router: Router, private _snackBar: MatSnackBar) {

  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.folderId = params['folder_id'] || '';
      this.rowId = params['id'] ? Number(params['id']) : null;

      if (this.isEditMode && this.rowId !== null) {
        this.loadRow();
      } else {
        this.ready = true;
      }
    });
  }

  private loadRow() {
    if (!this.folderId || this.rowId === null) {
      return;
    }

    this.mediaService.fetchFolderKey(this.folderId, this.rowId)
      .pipe(first())
      .subscribe({
        next: data => {
          this.key = data.key;
          this.value = data.value;
          this.purpose = data.purpose !== undefined ? data.purpose : 1;
          this.ready = true;
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
          this.goToList();
        }
      });
  }

  save() {
    if (this.isSaving) {
      return;
    }
    if (!this.isEditMode && !Utility.isNotBlank(this.key)) {
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.rowId !== null) {
      this.mediaService.updateFolderKey(this.folderId, this.rowId, this.value.trim(), this.purpose)
        .pipe(first())
        .subscribe({
          next: data => {
            this.isSaving = false;
            if (data && data.message) {
              this._snackBar.open(data.message, undefined, { duration: 3000 });
            }
          }, error: error => {
            this.isSaving = false;
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    } else {
      this.mediaService.addFolderKey(this.folderId, this.key.trim(), this.value.trim(), this.purpose)
        .pipe(first())
        .subscribe({
          next: data => {
            this.isSaving = false;
            const newId = data ? data['id'] : null;
            if (newId) {
              this.router.navigate(['/a-media', 'key', this.folderId, newId]);
              return;
            }
            this.refreshAndFind();
          }, error: error => {
            this.isSaving = false;
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  private refreshAndFind() {
    this.mediaService.fetchFolderKeys(this.folderId)
      .pipe(first())
      .subscribe({
        next: data => {
          const match = (data || []).find(item => item.key === this.key.trim() && item.purpose === this.purpose);
          if (match) {
            this.router.navigate(['/a-media', 'key', this.folderId, match.id]);
          } else {
            this.goToList();
          }
        }, error: () => {
          this.goToList();
        }
      });
  }

  removeKey() {
    if (this.isSaving || this.rowId === null) {
      return;
    }

    if (!confirm(this.noticeService.getMessage('msgs.are_sure_delete_key', { 'name': this.key }))) {
      return;
    }

    this.isSaving = true;

    this.mediaService.removeFolderKey(this.folderId, this.rowId)
      .pipe(first())
      .subscribe({
        next: data => {
          this.isSaving = false;
          if (data && data.message) {
            this._snackBar.open(data.message, undefined, { duration: 3000 });
          }
          this.goToList();
        }, error: error => {
          this.isSaving = false;
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  cancel() {
    this.goToList();
  }

  private goToList() {
    this.router.navigate(['/a-media', 'keys', this.folderId]);
  }

}
