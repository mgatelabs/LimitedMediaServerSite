import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, first, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { VolumeService, ChapterFileItem } from '../volume.service';
import { ActionPlugin, PluginService } from '../plugin.service';
import { StatusData } from '../process.service';
import { LoadingService } from '../loading.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ProcessMonitorComponent } from '../process-monitor/process-monitor.component';
import { EntityBannerComponent } from '../entity-banner/entity-banner.component';

@Component({
  selector: 'app-chapter-image-merger',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatGridListModule,
    TranslocoDirective,
    LoadingSpinnerComponent,
    ProcessMonitorComponent,
    EntityBannerComponent,
  ],
  templateUrl: './chapter-image-merger.component.html',
  styleUrl: './chapter-image-merger.component.css'
})
export class ChapterImageMergerComponent implements OnInit, OnDestroy {

  selectedBook: string = '';
  selectedChapter: string = '';
  files: ChapterFileItem[] = [];
  isLoading: boolean = false;
  selectedIndices = new Set<number>();
  lastClickedIndex: number | null = null;
  numberOfColumns: number = 2;
  loadNumber: number = Date.now();
  isMerging: boolean = false;
  activeTaskId: number | null = null;
  mergeError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private volumeService: VolumeService,
    private pluginService: PluginService,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpointObserver.observe([
      Breakpoints.XSmall, Breakpoints.Small,
      Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge
    ]).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall])     this.numberOfColumns = 2;
      else if (result.breakpoints[Breakpoints.Small]) this.numberOfColumns = 4;
      else                                            this.numberOfColumns = 6;
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.selectedBook = params['book_name'];
      this.selectedChapter = params['chapter_name'];
      this.loadImages();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get mergeGroups(): string[][] {
    if (this.files.length === 0 || this.selectedIndices.size === 0) return [];
    const sorted = [...this.selectedIndices].sort((a, b) => a - b);
    const groups: string[][] = [];

    let runStart = sorted[0];
    let runEnd = sorted[0];

    const emitRun = () => {
      if (runEnd + 1 >= this.files.length) return;
      const group: string[] = [];
      for (let j = runStart; j <= runEnd + 1; j++) {
        group.push(this.files[j].filename);
      }
      if (group.length >= 2) groups.push(group);
    };

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === runEnd + 1) {
        runEnd = sorted[i];
      } else {
        emitRun();
        runStart = sorted[i];
        runEnd = sorted[i];
      }
    }
    emitRun();
    return groups;
  }

  get previewSlots(): { index: number; url: string }[] {
    if (this.lastClickedIndex === null || this.files.length === 0) return [];
    const idx = this.lastClickedIndex;

    let runStart = idx;
    while (runStart > 0 && this.selectedIndices.has(runStart - 1)) runStart--;
    let runEnd = idx;
    while (runEnd < this.files.length - 1 && this.selectedIndices.has(runEnd + 1)) runEnd++;

    const endInclusive = Math.min(runEnd + 1, this.files.length - 1);
    const slots: { index: number; url: string }[] = [];
    for (let j = runStart; j <= endInclusive; j++) {
      slots.push({ index: j, url: this.imageUrl(this.files[j].filename) });
    }
    return slots;
  }

  get canMerge(): boolean {
    return this.mergeGroups.length > 0 && !this.isMerging && !this.isLoading;
  }

  get selectedCount(): number {
    return this.selectedIndices.size;
  }

  imageUrl(filename: string): string {
    return `/api/volume/serve_image/${encodeURIComponent(this.selectedBook)}/${encodeURIComponent(this.selectedChapter)}/${encodeURIComponent(filename)}?t=${this.loadNumber}&quick=true`;
  }

  isSelected(index: number): boolean {
    return this.selectedIndices.has(index);
  }

  toggleImage(index: number): void {
    if (index >= this.files.length - 1) return;
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
    } else {
      this.selectedIndices.add(index);
    }
    this.lastClickedIndex = index;
  }

  clearSelection(): void {
    this.selectedIndices.clear();
    this.lastClickedIndex = null;
  }

  private loadImages(): void {
    this.isLoading = true;
    this.loadingService.show('');
    this.selectedIndices.clear();
    this.lastClickedIndex = null;
    this.loadNumber = Date.now();

    this.volumeService.fetchImages(this.selectedBook, this.selectedChapter, true)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.files = data.files.map((f: any) => ({ filename: f, selected: false }));
          this.isLoading = false;
          this.loadingService.hide();
        },
        error: err => {
          this.isLoading = false;
          this.loadingService.hide();
          this.snackBar.open(err.message, undefined, { duration: 3000 });
        }
      });
  }

  executeMerge(): void {
    const groups = this.mergeGroups;
    if (groups.length === 0) return;

    this.isMerging = true;
    this.mergeError = null;
    this.activeTaskId = null;

    const plugin: ActionPlugin = {
      id: 'action.book.merge.images',
      icon: 'merge',
      name: 'Merge Images',
      args: [],
      category: 'Book',
      standalone: false,
      prefix_lang_id: ''
    };
    const args = new Map<string, string>([
      ['book_id',      this.selectedBook],
      ['chapter_id',   this.selectedChapter],
      ['merge_groups', JSON.stringify(groups)]
    ]);

    this.pluginService.runActionPlugin(plugin, args)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.task_id) {
            this.activeTaskId = result.task_id;
          } else {
            this.isMerging = false;
            this.snackBar.open('Merge started but no task ID returned.', undefined, { duration: 3000 });
          }
        },
        error: err => {
          this.isMerging = false;
          this.mergeError = err.message || 'Failed to start merge.';
        }
      });
  }

  onMergeSuccess(_statusData: StatusData): void {
    this.isMerging = false;
    this.activeTaskId = null;
    this.snackBar.open('Merge complete.', undefined, { duration: 2000 });
    this.router.navigate(['/a-volume', 'images-editor', this.selectedBook, this.selectedChapter]);
  }

  onMergeFailure(statusData: StatusData): void {
    this.isMerging = false;
    this.activeTaskId = null;
    this.mergeError = statusData.description || 'Merge failed.';
  }

  navigateBack(): void {
    this.router.navigate(['/a-volume', 'images-editor', this.selectedBook, this.selectedChapter]);
  }
}
