import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChapterInfo, DuplicateGroup, DuplicateItem, DuplicateScanData, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, concatMap, from, catchError, of, first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingService } from '../loading.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { NoticeService } from '../notice.service';
import { MatDividerModule } from '@angular/material/divider';
import { ProcessMonitorComponent } from '../process-monitor/process-monitor.component';
import { StatusData } from '../process.service';
import { EntityBannerComponent } from '../entity-banner/entity-banner.component';

interface DuplicateGroupView {
  group: DuplicateGroup;
  selected: Set<string>;
}

interface BgScanMatch { chapter: string; filename: string; phash_distance: number; }
interface BgScanHit { source_chapter: string; source_filename: string; matches: BgScanMatch[]; }
interface BgScanResult { root_folder: string; chapters_scanned: number; duplicate_count: number; hits: BgScanHit[]; }

function itemKey(item: DuplicateItem): string {
  return `${item.chapter}/${item.filename}`;
}

@Component({
  selector: 'app-series-duplicate-finder',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatToolbarModule,
    MatDividerModule, MatSidenavModule,
    MatFormFieldModule, MatInputModule,
    LoadingSpinnerComponent, TranslocoDirective,
    ProcessMonitorComponent, EntityBannerComponent
  ],
  templateUrl: './series-duplicate-finder.component.html',
  styleUrl: './series-duplicate-finder.component.css'
})
export class SeriesDuplicateFinderComponent implements OnInit, OnDestroy {

  selectedBook: string = '';

  // Chapter sidebar
  allChapters: ChapterInfo[] = [];
  isLoadingChapters: boolean = false;
  selectedChapterNames = new Set<string>();
  cohortSize: number = 10;
  cohorts: ChapterInfo[][] = [];
  sidebarOpen: boolean = true;

  // Scan state
  isScanning: boolean = false;
  scanData: DuplicateScanData | null = null;
  scanError: string | null = null;
  groupViews: DuplicateGroupView[] = [];
  autoScanProgress: { current: number; total: number } | null = null;
  failedBatches: { label: string; error: string }[] = [];

  // Background scan state
  activeTaskId: number | null = null;
  bgScanError: string | null = null;

  isDeleting: boolean = false;

  private loadNumber: number = Date.now();
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
      this.loadChapters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChapters(): void {
    this.isLoadingChapters = true;
    this.volumeService.fetchChapters(this.selectedBook)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allChapters = data.chapters;
          this.buildCohorts();
          this.isLoadingChapters = false;
        },
        error: err => {
          this.isLoadingChapters = false;
          this.scanError = err.message;
        }
      });
  }

  // Find the best batch size <= cohortSize (down to cohortSize/2) that minimises
  // the remainder, so the last batch isn't a singleton.
  private effectiveCohortSize(): number {
    const total = this.allChapters.length;
    if (total === 0 || total <= this.cohortSize) return this.cohortSize;
    const min = Math.max(1, Math.floor(this.cohortSize / 2));
    let best = this.cohortSize;
    let bestRemainder = total % this.cohortSize;
    for (let size = this.cohortSize - 1; size >= min; size--) {
      const rem = total % size;
      if (rem === 0) return size; // perfect fit — every batch is the same size
      if (rem > bestRemainder) {
        best = size;
        bestRemainder = rem;
      }
    }
    return best;
  }

  buildCohorts(): void {
    this.cohorts = [];
    const size = this.effectiveCohortSize();
    let current: ChapterInfo[] = [];
    for (const ch of this.allChapters) {
      if (current.length >= size) {
        this.cohorts.push(current);
        current = [];
      }
      current.push(ch);
    }
    if (current.length > 0) this.cohorts.push(current);
  }

  onCohortSizeChange(): void {
    this.buildCohorts();
  }

  toggleChapter(name: string): void {
    if (this.selectedChapterNames.has(name)) {
      this.selectedChapterNames.delete(name);
    } else {
      this.selectedChapterNames.add(name);
    }
  }

  isCohortFullySelected(cohort: ChapterInfo[]): boolean {
    return cohort.length > 0 && cohort.every(ch => this.selectedChapterNames.has(ch.name));
  }

  isCohortPartiallySelected(cohort: ChapterInfo[]): boolean {
    return !this.isCohortFullySelected(cohort) && cohort.some(ch => this.selectedChapterNames.has(ch.name));
  }

  toggleCohort(cohort: ChapterInfo[]): void {
    if (this.isCohortFullySelected(cohort)) {
      cohort.forEach(ch => this.selectedChapterNames.delete(ch.name));
    } else {
      cohort.forEach(ch => this.selectedChapterNames.add(ch.name));
    }
  }

  selectAllChapters(): void {
    this.allChapters.forEach(ch => this.selectedChapterNames.add(ch.name));
  }

  clearChapterSelection(): void {
    this.selectedChapterNames.clear();
  }

  get chapterFilterLabel(): string {
    const n = this.selectedChapterNames.size;
    return n === 0 ? `All ${this.allChapters.length} chapters` : `${n} of ${this.allChapters.length} chapters`;
  }

  // For each chapter, count how many of its images appear in any duplicate group.
  // Returns rows sorted by dupCount descending. No percentage — image count is not available.
  get chapterOverlap(): { name: string; dupCount: number }[] {
    if (!this.scanData) return [];

    const dupCount = new Map<string, number>();
    for (const gv of this.groupViews) {
      for (const item of gv.group.items) {
        dupCount.set(item.chapter, (dupCount.get(item.chapter) ?? 0) + 1);
      }
    }

    const rows: { name: string; dupCount: number }[] = [];
    for (const [name, count] of dupCount.entries()) {
      rows.push({ name, dupCount: count });
    }
    return rows.sort((a, b) => b.dupCount - a.dupCount);
  }

  scan(): void {
    this.isScanning = true;
    this.scanData = null;
    this.scanError = null;
    this.groupViews = [];
    this.autoScanProgress = null;
    this.failedBatches = [];
    this.loadNumber = Date.now();

    const filter = this.selectedChapterNames.size > 0
      ? [...this.selectedChapterNames]
      : undefined;

    this.volumeService.scanDuplicates(this.selectedBook, filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.scanData = data;
          this.groupViews = data.groups.map(g => ({ group: g, selected: new Set<string>() }));
          this.isScanning = false;
        },
        error: err => {
          this.isScanning = false;
          this.scanError = err.message || 'Scan failed. The server may have timed out.';
        }
      });
  }

  autoScanAll(): void {
    if (this.cohorts.length === 0) return;

    this.isScanning = true;
    this.scanData = null;
    this.scanError = null;
    this.groupViews = [];
    this.failedBatches = [];
    this.loadNumber = Date.now();

    const allGroups: DuplicateGroup[] = [];
    let totalChaptersScanned = 0;
    let batchIndex = 0;

    this.autoScanProgress = { current: 1, total: this.cohorts.length };

    // Scan a list of chapter names. On failure, split in half and retry each half once.
    // On second failure, record as failed and resolve so the outer loop can continue.
    const scanChapters = (chapters: ChapterInfo[], label: string): Promise<void> => {
      return new Promise(resolve => {
        this.volumeService.scanDuplicates(this.selectedBook, chapters.map(ch => ch.name))
          .pipe(first(), takeUntil(this.destroy$))
          .subscribe({
            next: data => {
              allGroups.push(...data.groups);
              totalChaptersScanned += data.chapters_scanned;
              resolve();
            },
            error: err => {
              if (chapters.length <= 1) {
                this.failedBatches.push({ label, error: err.message || 'Server timed out.' });
                resolve();
                return;
              }
              // Split and retry each half once
              const mid = Math.ceil(chapters.length / 2);
              const halves = [chapters.slice(0, mid), chapters.slice(mid)];
              const halfLabels = [`${label}a`, `${label}b`];
              let remaining = 2;
              const done = () => { if (--remaining === 0) resolve(); };
              halves.forEach((half, i) => {
                this.volumeService.scanDuplicates(this.selectedBook, half.map(ch => ch.name))
                  .pipe(first(), takeUntil(this.destroy$))
                  .subscribe({
                    next: data => {
                      allGroups.push(...data.groups);
                      totalChaptersScanned += data.chapters_scanned;
                      done();
                    },
                    error: halfErr => {
                      this.failedBatches.push({ label: halfLabels[i], error: halfErr.message || 'Server timed out.' });
                      done();
                    }
                  });
              });
            }
          });
      });
    };

    const runNext = async () => {
      while (batchIndex < this.cohorts.length) {
        this.autoScanProgress = { current: batchIndex + 1, total: this.cohorts.length };
        await scanChapters(this.cohorts[batchIndex], `Batch ${batchIndex + 1}`);
        batchIndex++;
      }
      this.autoScanProgress = null;
      this.isScanning = false;
      const merged: DuplicateScanData = {
        groups: allGroups,
        total_groups: allGroups.length,
        chapters_scanned: totalChaptersScanned
      };
      this.scanData = merged;
      this.groupViews = merged.groups.map(g => ({ group: g, selected: new Set<string>() }));
    };

    runNext();
  }

  imageUrl(item: DuplicateItem): string {
    return `/api/volume/serve_image/${encodeURIComponent(this.selectedBook)}/${encodeURIComponent(item.chapter)}/${encodeURIComponent(item.filename)}?t=${this.loadNumber}&quick=true`;
  }

  toggleItem(gv: DuplicateGroupView, item: DuplicateItem): void {
    const key = itemKey(item);
    if (gv.selected.has(key)) {
      gv.selected.delete(key);
    } else {
      gv.selected.add(key);
    }
  }

  isItemSelected(gv: DuplicateGroupView, item: DuplicateItem): boolean {
    return gv.selected.has(itemKey(item));
  }

  toggleGroup(gv: DuplicateGroupView): void {
    const allSelected = gv.group.items.every(i => gv.selected.has(itemKey(i)));
    if (allSelected) {
      gv.selected.clear();
    } else {
      gv.group.items.forEach(i => gv.selected.add(itemKey(i)));
    }
  }

  isGroupFullySelected(gv: DuplicateGroupView): boolean {
    return gv.group.items.length > 0 && gv.group.items.every(i => gv.selected.has(itemKey(i)));
  }

  selectAll(): void {
    for (const gv of this.groupViews) {
      gv.group.items.forEach(i => gv.selected.add(itemKey(i)));
    }
  }

  clearSelection(): void {
    for (const gv of this.groupViews) {
      gv.selected.clear();
    }
  }

  get selectedItems(): { chapter: string; filename: string }[] {
    const result: { chapter: string; filename: string }[] = [];
    for (const gv of this.groupViews) {
      for (const item of gv.group.items) {
        if (gv.selected.has(itemKey(item))) {
          result.push({ chapter: item.chapter, filename: item.filename });
        }
      }
    }
    return result;
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  deleteSelected(): void {
    const items = this.selectedItems;
    if (items.length === 0) return;

    const seen = new Set<string>();
    const unique = items.filter(i => {
      const k = `${i.chapter}/${i.filename}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (!confirm(`Delete ${unique.length} image${unique.length > 1 ? 's' : ''}?`)) return;

    const sorted = [...unique].sort((a, b) => {
      const chapterDiff = b.chapter.localeCompare(a.chapter);
      if (chapterDiff !== 0) return chapterDiff;
      return b.filename.localeCompare(a.filename);
    });

    this.isDeleting = true;
    this.loading.show('');

    from(sorted).pipe(
      concatMap((item, idx) => {
        this.loading.show(
          this.noticeService.getMessage('msgs.info_deleting_file',
            { fileName: item.filename, index: idx + 1, total: sorted.length })
        );
        return this.volumeService.removeImage(this.selectedBook, item.chapter, item.filename).pipe(
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
        this.snackBar.open(`Deleted ${sorted.length} image${sorted.length > 1 ? 's' : ''}`, undefined, { duration: 2000 });
        this.scanData = null;
        this.groupViews = [];
        this.scanError = null;
      }
    });
  }

  backgroundScan(): void {
    this.isScanning = true;
    this.scanData = null;
    this.scanError = null;
    this.bgScanError = null;
    this.groupViews = [];
    this.autoScanProgress = null;
    this.failedBatches = [];
    this.activeTaskId = null;
    this.loadNumber = Date.now();

    this.volumeService.backgroundScanDuplicates(this.selectedBook)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.task_id) {
            this.activeTaskId = result.task_id;
          } else {
            this.isScanning = false;
            this.bgScanError = 'Background scan did not return a task ID.';
          }
        },
        error: err => {
          this.isScanning = false;
          this.bgScanError = err.message || 'Failed to start background scan.';
        }
      });
  }

  onBgScanSuccess(statusData: StatusData): void {
    this.isScanning = false;
    this.activeTaskId = null;

    if (!statusData.worked) {
      this.scanData = { groups: [], total_groups: 0, chapters_scanned: 0 };
      this.groupViews = [];
      return;
    }

    const infoEntry = statusData.log.find(l => l.s === 20 && l.text.includes('"hits"'));
    if (!infoEntry) {
      this.bgScanError = 'Background scan completed but no result data was found in the log.';
      return;
    }

    try {
      const raw: BgScanResult = JSON.parse(infoEntry.text);
      const scanData = this.convertBgScanResult(raw);
      this.scanData = scanData;
      this.groupViews = scanData.groups.map(g => ({ group: g, selected: new Set<string>() }));
    } catch {
      this.bgScanError = 'Failed to parse background scan result.';
    }
  }

  onBgScanFailure(statusData: StatusData): void {
    this.isScanning = false;
    this.activeTaskId = null;
    this.bgScanError = statusData.description || 'Background scan failed.';
  }

  private convertBgScanResult(raw: BgScanResult): DuplicateScanData {
    const parent = new Map<string, string>();

    const find = (k: string): string => {
      if (!parent.has(k)) parent.set(k, k);
      const p = parent.get(k)!;
      if (p !== k) {
        const root = find(p);
        parent.set(k, root);
        return root;
      }
      return k;
    };

    const union = (a: string, b: string): void => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    for (const hit of raw.hits) {
      const srcKey = `${hit.source_chapter}/${hit.source_filename}`;
      for (const m of hit.matches) {
        union(srcKey, `${m.chapter}/${m.filename}`);
      }
    }

    const groups = new Map<string, DuplicateItem[]>();
    for (const key of parent.keys()) {
      const root = find(key);
      if (!groups.has(root)) groups.set(root, []);
      const slash = key.indexOf('/');
      groups.get(root)!.push({ chapter: key.slice(0, slash), filename: key.slice(slash + 1) });
    }

    const groupArray = [...groups.values()].map(items => ({ items }));
    return { groups: groupArray, total_groups: groupArray.length, chapters_scanned: raw.chapters_scanned };
  }
}
