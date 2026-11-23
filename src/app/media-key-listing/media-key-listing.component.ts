import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MediaKeyValueDefinition, MediaService } from '../media.service';
import { NoticeService } from '../notice.service';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-media-key-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatCardModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, TranslocoDirective, LoadingSpinnerComponent],
  templateUrl: './media-key-listing.component.html',
  styleUrl: './media-key-listing.component.css'
})
export class MediaKeyListingComponent implements OnDestroy {

  folderId: string = '';

  keys: MediaKeyValueDefinition[] = [];
  filteredKeys: MediaKeyValueDefinition[] = [];

  isLoading: boolean = false;

  searchQuery: string = '';

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
      this.refreshData();
    });
  }

  refreshData() {
    if (!this.folderId) {
      return;
    }

    this.isLoading = true;

    this.mediaService.fetchFolderKeys(this.folderId)
      .pipe(first())
      .subscribe(
        {
          next: data => {
            this.isLoading = false;
            this.keys = data || [];
            this.filterKeys();
          }, error: error => {
            this.isLoading = false;
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }

  applyFilter(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.filterKeys();
  }

  filterKeys() {
    const value = this.searchQuery.trim().toLowerCase();

    if (!value) {
      this.filteredKeys = [...this.keys];
      return;
    }

    this.filteredKeys = this.keys.filter(key =>
      (key.key && key.key.toLowerCase().includes(value)) ||
      (key.value && key.value.toLowerCase().includes(value))
    );
  }

  addKey() {
    this.router.navigate(['/a-media', 'key', this.folderId]);
  }

  editKey(item: MediaKeyValueDefinition) {
    this.router.navigate(['/a-media', 'key', this.folderId, item.id]);
  }

  removeKey(item: MediaKeyValueDefinition) {
    if (!confirm(this.noticeService.getMessage('msgs.are_sure_delete_key', { 'name': item.key }))) {
      return;
    }

    this.mediaService.removeFolderKey(this.folderId, item.id)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data && data.message) {
            this._snackBar.open(data.message, undefined, { duration: 3000 });
          }
          this.refreshData();
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

}
