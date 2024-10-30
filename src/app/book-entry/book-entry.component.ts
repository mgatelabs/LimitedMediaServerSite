import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProcessWidgetComponent } from '../process-widget/process-widget.component';
import { BookDefinition, ProcessorDefinition, VolumeService } from '../volume.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { catchError, first, of } from 'rxjs';

@Component({
  selector: 'app-book-entry',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, ProcessWidgetComponent, MatIconModule],
  templateUrl: './book-entry.component.html',
  styleUrl: './book-entry.component.css'
})
export class BookEntryComponent implements OnInit {

  processors: ProcessorDefinition[] = [];

  selected_processor: ProcessorDefinition = { name: '', id: '', baseUrl: false, startId: false, rss: false, baseUrlDescription: '', rssDescription: '', pageDescription: '', startIdDescription: '' };

  book_id: string = '';
  book_name: string = '';
  book_type: string = 'offline';
  book_base_url: string = '';
  book_start: string = '';
  book_url: string = '';
  book_rss: string = '';
  book_style: string = 'page';
  book_skip: string = '';
  book_restricted: boolean = true;
  book_active: boolean = true;
  book_rating: number = 200;

  constructor(private volumeService: VolumeService, private _snackBar: MatSnackBar) {

  }

  ngOnInit() {

    this.volumeService.fetchProcessors()
      .pipe(first())
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to fetch processor list'; // Use the error message if available
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);  // Return a fallback value or empty observable
        })
      )
      .subscribe(data => {
        if (data) {
          this.processors = data;
          if (this.processors.length > 0) {
            this.selected_processor = this.processors[0];
          }
        }
      });

  }

  isValidValue(value: string): boolean {
    const regex = /^[A-Za-z0-9-_]+$/;
    return regex.test(value);
  }

  createBook() {
    let result: BookDefinition = {
      id: '',
      name: '',
      extra_url: '',
      start_chapter: '',
      processor: '',
      info_url: '',
      rss_url: '',
      skip: '',
      style: 'page',
      active: true,
      tags: [],
      rating: 200
    };

    result.active = this.book_active;
    result.extra_url = this.book_base_url;
    result.id = this.book_id;
    result.name = this.book_name;
    result.info_url = this.book_url;
    result.rss_url = this.book_rss;
    result.skip = this.book_skip;
    result.start_chapter = this.book_start;
    result.style = this.book_style == 'page' ? 'page' : 'scroll';
    result.processor = this.book_type;
    result.rating = this.book_rating;

    result.tags = [];

    let messages = this.volumeService.validateBookDefinition(result, this.selected_processor);

    if (messages.length == 0) {
      this.pushBook(result);
    } else {
      this._snackBar.open('Error: ' + messages.join(', '), undefined, {
        duration: 5000
      });
    }

  }

  pushBook(def: BookDefinition) {
    this.volumeService.addBook(def)
      .pipe(first())
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to add book'; // Use the error message if available
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);  // Return a fallback value or empty observable
        })
      )
      .subscribe(data => {
        if (data) {
          if (data.message) {
            this._snackBar.open(data.message, undefined, {
              duration: 3000
            });
          }        
        }
      });
  }

  processor_changed() {
    for (let item of this.processors) {
      if (item.id === this.book_type) {
        this.selected_processor = item;
        break;
      }
    }
  }

  cleanId() {
    this.book_id = this.sanitizeString(this.book_id);
  }

  sanitizeString(inputString: string): string {
    // Replace all non A-z 0-9 and - characters with _
    let sanitized = inputString.replace(/[^A-Za-z0-9-]/g, '_');

    // Initialize a variable to track changes
    let previous;

    // Loop until no further changes occur
    do {
      previous = sanitized;
      // Merge multiple _ together
      sanitized = sanitized.replace(/_+/g, '_');
      // Replace _- or -_ with -
      sanitized = sanitized.replace(/(_-)|(-_)/g, '-');
      // Merge multiple - together
      sanitized = sanitized.replace(/-+/g, '-');
    } while (sanitized !== previous);

    // Remove leading and trailing _ or -
    sanitized = sanitized.replace(/^[_-]+|[_-]+$/g, '');

    return sanitized;
  }
}
