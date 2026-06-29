import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BookDefinition, ProcessorDefinition, VolumeService } from '../volume.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { first, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-book-entry',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatCardModule, MatButtonModule, FormsModule, RouterModule, MatToolbarModule, MatIconModule, TranslocoDirective],
  templateUrl: './book-entry.component.html',
  styleUrl: './book-entry.component.css'
})
export class BookEntryComponent implements OnInit, OnDestroy {

  processors: ProcessorDefinition[] = [];
  selected_processor: ProcessorDefinition = { name: '', id: '', baseUrl: false, startId: false, rss: false, baseUrlDescription: '', rssDescription: '', pageDescription: '', startIdDescription: '' };

  is_new: boolean = true;
  ready: boolean = false;
  title: string = 'form.book_entry';

  book_id: string = '';
  book_name: string = '';
  book_processor: string = 'offline';
  book_base_url: string = '';
  book_start: string = '';
  book_url: string = '';
  book_rss: string = '';
  book_style: string = 'page';
  book_skip: string = '';
  book_active: boolean = true;
  book_rating: number = 200;
  book_tags: string = '';

  private destroy$ = new Subject<void>();

  constructor(private volumeService: VolumeService, private router: Router, private route: ActivatedRoute, private _snackBar: MatSnackBar) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.volumeService.fetchProcessors().pipe(first()).subscribe({
      next: data => {
        if (data) {
          this.processors = data;
          if (this.processors.length > 0 && this.book_processor === 'offline') {
            this.processor_changed();
          }
        }
      },
      error: error => this._snackBar.open(error.message, undefined, { duration: 3000 })
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const book_name = params['book_name'];
      if (book_name) {
        this.is_new = false;
        this.title = 'form.book_details';
        this.book_id = book_name;

        this.volumeService.fetchBookDetails(book_name).pipe(first()).subscribe({
          next: data => {
            if (data) {
              this.book_id = data.id;
              this.book_name = data.name;
              this.book_processor = data.processor;
              this.book_base_url = data.extra_url;
              this.book_start = data.start_chapter;
              this.book_url = data.info_url;
              this.book_rss = data.rss_url;
              this.book_style = data.style;
              this.book_skip = data.skip;
              this.book_active = data.active;
              this.book_rating = data.rating;
              this.book_tags = data.tags ? data.tags.join(',') : '';
              this.processor_changed();
              this.ready = true;
            }
          },
          error: error => this._snackBar.open(error.message, undefined, { duration: 3000 })
        });
      } else {
        this.is_new = true;
        this.title = 'form.book_entry';
        this.ready = true;
      }
    });
  }

  processor_changed() {
    const match = this.processors.find(p => p.id === this.book_processor);
    this.selected_processor = match ?? this.selected_processor;
  }

  saveBook() {
    const result: BookDefinition = {
      id: this.book_id,
      name: this.book_name,
      extra_url: this.book_base_url,
      start_chapter: this.book_start,
      processor: this.book_processor,
      info_url: this.book_url,
      rss_url: this.book_rss,
      skip: this.book_skip,
      style: this.book_style === 'page' ? 'page' : 'scroll',
      active: this.book_active,
      tags: this.book_tags.split(',').map(t => t.trim()).filter(t => t),
      rating: this.book_rating
    };

    const messages = this.volumeService.validateBookDefinition(result, this.selected_processor);
    if (messages.length > 0) {
      this._snackBar.open('Error: ' + messages.join(', '), undefined, { duration: 5000 });
      return;
    }

    if (this.is_new) {
      this.volumeService.addBook(result).pipe(first()).subscribe({
        next: data => {
          if (data) {
            this.router.navigate(['/a-volume', 'edit-book', result.id]);
          }
        },
        error: error => this._snackBar.open(error.message, undefined, { duration: 3000 })
      });
    } else {
      this.volumeService.updateBook(result).pipe(first()).subscribe({
        next: data => {
          if (data?.message) {
            this._snackBar.open(data.message, undefined, { duration: 3000 });
          }
        },
        error: error => this._snackBar.open(error.message, undefined, { duration: 3000 })
      });
    }
  }

  editTags() {
    if (!this.book_tags.trim()) {
      this._snackBar.open('No tags to process', undefined, { duration: 3000 });
      return;
    }
    const values = this.book_tags.split(',').map(t => t.trim()).filter(t => t).join(' ');
    this.volumeService.guessTags(values).pipe(first()).subscribe({
      next: tags => {
        if (tags && tags.length > 0) {
          this.book_tags = tags.join(',');
          this._snackBar.open('Tags updated with ' + tags.length + ' suggestions', undefined, { duration: 3000 });
        } else {
          this._snackBar.open('No results from tag guessing', undefined, { duration: 3000 });
        }
      },
      error: error => this._snackBar.open(error.message || 'Failed to guess tags', undefined, { duration: 3000 })
    });
  }

  cleanId() {
    this.book_id = this.sanitizeString(this.book_id);
  }

  private sanitizeString(input: string): string {
    let s = input.replace(/[^A-Za-z0-9-]/g, '_');
    let prev: string;
    do {
      prev = s;
      s = s.replace(/_+/g, '_').replace(/(_-)|(-_)/g, '-').replace(/-+/g, '-');
    } while (s !== prev);
    s = s.replace(/^[_-]+|[_-]+$/g, '');
    return s.length > 128 ? s.substring(0, 128) : s;
  }
}
