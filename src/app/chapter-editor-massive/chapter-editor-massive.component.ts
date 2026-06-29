import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChapterFilesData, ChapterInfo, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, concatMap, from, catchError, of } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingService } from '../loading.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { NoticeService } from '../notice.service';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

const PAGE_SIZE = 25;

interface ImageSlot {
  filename: string;
  index: number;
  selected: boolean;
}

interface ChapterView {
  chapter: ChapterInfo;
  files: ChapterFilesData;
  loading: boolean;
  loadNumber: number;
}

@Component({
  selector: 'app-chapter-editor-massive',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatToolbarModule,
    MatProgressBarModule, MatCardModule, MatDividerModule, MatBadgeModule,
    LoadingSpinnerComponent, TranslocoDirective
  ],
  templateUrl: './chapter-editor-massive.component.html',
  styleUrl: './chapter-editor-massive.component.css'
})
export class ChapterEditorMassiveComponent implements OnInit, OnDestroy {

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  selectedBook: string = '';
  bookName: string = '';

  allChapters: ChapterInfo[] = [];
  pageIndex: number = 0;
  totalPages: number = 0;

  chapterViews: ChapterView[] = [];
  isLoadingChapters: boolean = false;
  loadedCount: number = 0;

  isDeleting: boolean = false;
  deletedCount: number = 0;
  deleteTotal: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private volumeService: VolumeService,
    private snackBar: MatSnackBar,
    private loading: LoadingService,
    private noticeService: NoticeService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.selectedBook = params['book_name'];
      this.pageIndex = 0;
      this.loadChapterList();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChapterList(): void {
    this.isLoadingChapters = true;
    this.chapterViews = [];
    this.volumeService.fetchChapters(this.selectedBook)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allChapters = data.chapters;
          this.bookName = data.name;
          this.totalPages = Math.ceil(this.allChapters.length / PAGE_SIZE);
          this.isLoadingChapters = false;
          this.loadPage();
        },
        error: err => {
          this.isLoadingChapters = false;
          this.snackBar.open(err.message, undefined, { duration: 3000 });
        }
      });
  }

  private loadPage(): void {
    const start = this.pageIndex * PAGE_SIZE;
    const slice = this.allChapters.slice(start, start + PAGE_SIZE);

    this.chapterViews = slice.map(ch => ({
      chapter: ch,
      files: { next: '', prev: '', files: [], sizes: [] },
      loading: true,
      loadNumber: Date.now()
    }));

    this.loadedCount = 0;

    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }

    slice.forEach((ch, i) => {
      this.volumeService.fetchImages(this.selectedBook, ch.name, false)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: data => {
            const files = data.files.map(f => ({ filename: f, selected: false }));
            this.chapterViews[i].files = {
              next: data.next, prev: data.prev, files, sizes: []
            };
            this.chapterViews[i].loading = false;
            this.loadedCount++;
          },
          error: () => {
            this.chapterViews[i].loading = false;
            this.loadedCount++;
          }
        });
    });
  }

  visibleImages(view: ChapterView): ImageSlot[] {
    const files = view.files.files;
    const total = files.length;
    if (total === 0) return [];

    const indices = new Set<number>([0]);
    if (total > 1) indices.add(1);
    if (total > 2) indices.add(total - 2);
    if (total > 3) indices.add(total - 1);

    return [...indices].sort((a, b) => a - b).map(idx => ({
      filename: files[idx].filename,
      index: idx,
      selected: files[idx].selected
    }));
  }

  toggleSelect(view: ChapterView, filename: string): void {
    const file = view.files.files.find(f => f.filename === filename);
    if (file) file.selected = !file.selected;
  }

  get selectedItems(): { chapterName: string; filename: string }[] {
    const result: { chapterName: string; filename: string }[] = [];
    for (const view of this.chapterViews) {
      for (const file of view.files.files) {
        if (file.selected) {
          result.push({ chapterName: view.chapter.name, filename: file.filename });
        }
      }
    }
    return result;
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  clearSelection(): void {
    for (const view of this.chapterViews) {
      for (const file of view.files.files) {
        file.selected = false;
      }
    }
  }

  deleteSelected(): void {
    const items = this.selectedItems;
    if (items.length === 0) return;
    if (!confirm(`Delete ${items.length} image${items.length > 1 ? 's' : ''}?`)) return;

    this.isDeleting = true;
    this.deletedCount = 0;
    this.deleteTotal = items.length;
    this.loading.show('');

    const affectedChapters = new Set<string>(items.map(i => i.chapterName));

    from(items).pipe(
      concatMap((item, idx) => {
        this.loading.show(
          this.noticeService.getMessage('msgs.info_deleting_file',
            { fileName: item.filename, index: idx + 1, total: items.length })
        );
        return this.volumeService.removeImage(this.selectedBook, item.chapterName, item.filename).pipe(
          catchError(err => {
            this.snackBar.open(err?.message || `Failed: ${item.filename}`, undefined, { duration: 3000 });
            return of(null);
          })
        );
      })
    ).subscribe({
      complete: () => {
        this.loading.hide();
        this.isDeleting = false;
        this.snackBar.open(`Deleted ${items.length} image${items.length > 1 ? 's' : ''}`, undefined, { duration: 2000 });
        this.reloadChapters([...affectedChapters]);
      }
    });
  }

  private reloadChapters(chapterNames: string[]): void {
    for (const name of chapterNames) {
      const view = this.chapterViews.find(v => v.chapter.name === name);
      if (!view) continue;
      view.loading = true;
      view.loadNumber = Date.now();
      this.volumeService.fetchImages(this.selectedBook, name, false)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: data => {
            view.files = {
              next: data.next, prev: data.prev,
              files: data.files.map(f => ({ filename: f, selected: false })),
              sizes: []
            };
            view.loading = false;
          },
          error: err => {
            view.loading = false;
            this.snackBar.open(err.message, undefined, { duration: 3000 });
          }
        });
    }
  }

  imageUrl(chapter: string, filename: string, loadNumber: number): string {
    return `/api/volume/serve_image/${encodeURIComponent(this.selectedBook)}/${encodeURIComponent(chapter)}/${encodeURIComponent(filename)}?t=${loadNumber}&quick=true`;
  }

  isLastGroup(index: number, total: number): boolean {
    return index >= total - 2 && total > 2;
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadPage();
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.loadPage();
    }
  }

  get pageStart(): number { return this.pageIndex * PAGE_SIZE + 1; }
  get pageEnd(): number { return Math.min((this.pageIndex + 1) * PAGE_SIZE, this.allChapters.length); }
  get totalChapters(): number { return this.allChapters.length; }
  get isLoadingPage(): boolean { return this.isLoadingChapters || this.loadedCount < this.chapterViews.length; }
}
