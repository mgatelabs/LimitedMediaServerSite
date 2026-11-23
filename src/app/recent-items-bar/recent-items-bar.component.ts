import { Component, inject, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { RecentItemsService, RecentItemEntry, RecentItemType } from '../recent-items.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-recent-items-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, NgClass, TranslocoDirective],
  templateUrl: './recent-items-bar.component.html',
  styleUrl: './recent-items-bar.component.css'
})
export class RecentItemsBarComponent implements OnDestroy {
  private service = inject(RecentItemsService);
  private router = inject(Router);

  @Output() closeBar = new EventEmitter<void>();

  recentItems: RecentItemEntry[] = [];

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor() {
    this.service.items$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.recentItems = [...items];
    });
  }

  get hasItems(): boolean { return this.recentItems.length > 0; }

  close(): void {
    this.closeBar.emit();
  }

  clearAll(): void {
    this.service.clear();
  }

  hideItem(item: RecentItemEntry, event: Event): void {
    event.stopPropagation();
    this.service.remove(item.id);
  }

  togglePin(item: RecentItemEntry, event: Event): void {
    event.stopPropagation();
    this.service.togglePin(item.id);
  }

  getTimeLabel(addedAt: number): string {
    return this.service.getAddedAtLabel(addedAt);
  }

  getTypeIcon(type: RecentItemType): string {
    switch (type) {
      case 'media/folder': return 'movie';
      case 'process/task': return 'settings';
      case 'volume/book': return 'menu_book';
      case 'volume/chapter': return 'bookmark';
    }
  }

  getTypeClass(type: RecentItemType): string {
    switch (type) {
      case 'media/folder': return 'type-media-folder';
      case 'process/task': return 'type-process-task';
      case 'volume/book': return 'type-volume-book';
      case 'volume/chapter': return 'type-volume-chapter';
    }
  }

  navigate(item: RecentItemEntry): void {
    switch (item.type) {
      case 'media/folder':
        this.router.navigate(['/a-media', 'browse', item.id]);
        break;
      case 'process/task':
        this.router.navigate(['/a-task', item.id]);
        break;
      case 'volume/book':
        this.router.navigate(['/a-volume', 'book', item.id]);
        break;
      case 'volume/chapter': {
        const chapter = item.extra?.['chapter'] ?? '';
        const mode = item.extra?.['mode'] ?? 'thumb';
        const page = item.extra?.['page'];
        const route: (string)[] = ['/a-volume', 'images', item.id, chapter, mode];
        if (page) route.push(page);
        this.router.navigate(route);
        break;
      }
    }
  }
}
