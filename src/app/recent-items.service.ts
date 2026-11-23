import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type RecentItemType = 'media/folder' | 'process/task' | 'volume/book' | 'volume/chapter';

export interface RecentItemEntry {
  id: string;
  type: RecentItemType;
  title: string;
  addedAt: number;
  pinned?: boolean;
  extra?: Record<string, string>;
}

const STORAGE_KEY = 'recent_items_v1';
const MAX_ITEMS = 30;

@Injectable({
  providedIn: 'root'
})
export class RecentItemsService {
  private readonly _items$ = new BehaviorSubject<RecentItemEntry[]>([]);

  get items$() { return this._items$.asObservable(); }
  get items(): RecentItemEntry[] { return this._items$.value; }

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: RecentItemEntry[] = JSON.parse(stored);
        this._items$.next(parsed);
      } catch { /* ignore corrupt storage */ }
    }
  }

  add(type: RecentItemType, id: string, title: string, extra?: Record<string, string>): void {
    let list = this._items$.value;

    // Don't bump pinned items — just update title/extra silently if changed
    const existing = list.find(item => item.id === id);
    if (existing?.pinned) {
      const changed = existing.title !== title || JSON.stringify(existing.extra) !== JSON.stringify(extra);
      if (changed) {
        list = list.map(item => item.id === id ? { ...item, title, extra } : item);
        this.save(list);
      }
      return;
    }

    // Remove existing unpinned entry with the same id
    list = list.filter(item => item.id !== id);

    // Insert after all pinned items
    const pinnedCount = list.filter(item => item.pinned).length;
    list.splice(pinnedCount, 0, { id, type, title, addedAt: Date.now(), extra });

    // Trim unpinned tail so total stays within MAX_ITEMS
    const pinned = list.filter(item => item.pinned);
    const unpinned = list.filter(item => !item.pinned).slice(0, MAX_ITEMS - pinned.length);
    list = [...pinned, ...unpinned];

    this.save(list);
  }

  remove(id: string): void {
    const list = this._items$.value.filter(item => item.id !== id);
    this.save(list);
  }

  togglePin(id: string): void {
    let list = this._items$.value;
    const entry = list.find(item => item.id === id);
    if (!entry) return;

    const updated = { ...entry, pinned: !entry.pinned };
    list = list.filter(item => item.id !== id);

    if (updated.pinned) {
      // Move to end of pinned section
      const pinnedCount = list.filter(item => item.pinned).length;
      list.splice(pinnedCount, 0, updated);
    } else {
      // Move to top of unpinned section (just after pinned)
      const pinnedCount = list.filter(item => item.pinned).length;
      list.splice(pinnedCount, 0, updated);
    }

    this.save(list);
  }

  clear(): void {
    // Only clear unpinned items
    this.save(this._items$.value.filter(item => item.pinned));
  }

  /** Returns time-ago formatted label for tooltip */
  getAddedAtLabel(addedAt: number): string {
    const diff = Date.now() - addedAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  private save(list: RecentItemEntry[]): void {
    this._items$.next(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}
