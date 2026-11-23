import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { VolumeService } from '../volume.service';
import { MediaService } from '../media.service';

export type EntityBannerType = 'book' | 'folder' | 'media';

@Component({
  selector: 'app-entity-banner',
  standalone: true,
  imports: [RouterModule, MatIconModule, TranslocoDirective],
  templateUrl: './entity-banner.component.html',
  styleUrl: './entity-banner.component.css'
})
export class EntityBannerComponent implements OnChanges, OnDestroy {

  @Input() entityType!: EntityBannerType;
  @Input() entityId!: string;

  title: string = '';
  subTitle: string = '';
  isLoading: boolean = false;
  hasError: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private volumeService: VolumeService,
    private mediaService: MediaService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] || changes['entityType']) {
      this.loadTitle();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTitle(): void {
    if (!this.entityId || !this.entityType) return;

    this.isLoading = true;
    this.hasError = false;
    this.title = '';
    this.subTitle = '';

    switch (this.entityType) {
      case 'book':
        this.volumeService.fetchBookDetails(this.entityId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: data => {
              this.title = data.name || this.entityId;
              this.subTitle = data.alt_name || '';
              this.isLoading = false;
            },
            error: () => {
              this.title = this.entityId;
              this.isLoading = false;
              this.hasError = true;
            }
          });
        break;

      case 'folder':
        this.mediaService.fetchFolder(this.entityId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: data => {
              this.title = data.name || this.entityId;
              this.isLoading = false;
            },
            error: () => {
              this.title = this.entityId;
              this.isLoading = false;
              this.hasError = true;
            }
          });
        break;

      case 'media':
        this.mediaService.fetchFile(this.entityId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: data => {
              this.title = data.filename || this.entityId;
              this.isLoading = false;
            },
            error: () => {
              this.title = this.entityId;
              this.isLoading = false;
              this.hasError = true;
            }
          });
        break;
    }
  }

  get iconName(): string {
    switch (this.entityType) {
      case 'book': return 'auto_stories';
      case 'folder': return 'folder';
      case 'media': return 'video_file';
      default: return 'label';
    }
  }
}
