import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BookDefinition, ProcessorDefinition, VolumeService } from '../volume.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule, MatToolbarModule, MatInputModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './book-details.component.html',
  styleUrl: './book-details.component.css'
})
export class BookDetailsComponent implements OnInit, OnDestroy {

  processors: ProcessorDefinition[] = [];

  selected_processor: ProcessorDefinition = { name: '', id: '', baseUrl: false, startId: false, rss: false, pageDescription: '', baseUrlDescription: '', rssDescription: '', startIdDescription: '' };

  bookDetails: BookDefinition = {
    id: "",
    name: "",
    extra_url: "",
    start_chapter: "",
    processor: "offline",
    info_url: "",
    rss_url: "",
    skip: "",
    style: 'page',
    active: true,
    tags: [],
    rating: 200
  };
  selectedBook: string = "";
  currentTags: string = '';

  constructor(private volumeService: VolumeService, private route: ActivatedRoute, private _snackBar: MatSnackBar) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.volumeService.fetchProcessors()
      .pipe(first())
      .subscribe({
        next: data => {
          if (data) {
            this.processors = data;
          }
        }, error: error => {
          this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let bookName = params['book_name'];
      // You can use this.bookName here in your component logic
      this.selectedBook = bookName;

      this.volumeService.fetchBookDetails(this.selectedBook)
        .pipe(first())
        .subscribe(
          {
            next: data => {
              if (data) {
                this.bookDetails = data;
                if (this.bookDetails.tags) {
                  this.currentTags = this.bookDetails.tags.join(',');
                } else {
                  this.currentTags = '';
                }
                this.processor_changed();
              }
            }, error: error => {
              this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
          }
        );
    });
  }

  isValidValue(value: string): boolean {
    const regex = /^[A-Za-z0-9-_]+$/;
    return regex.test(value);
  }

  convertToTrimmedList(): string[] {
    return this.currentTags
      .split(',') // Split the string by comma
      .map(item => item.trim()); // Trim each item
  }

  updateBook() {
    let result: BookDefinition = {
      id: '',
      name: '',
      extra_url: '',
      start_chapter: '',
      processor: '',
      info_url: '',
      rss_url: '',
      style: 'page',
      skip: '',
      active: false,
      tags: this.convertToTrimmedList(),
      rating: 200
    };

    result.active = this.bookDetails.active;
    result.extra_url = this.bookDetails.extra_url;
    result.id = this.bookDetails.id;
    result.name = this.bookDetails.name;
    result.info_url = this.bookDetails.info_url;
    result.rss_url = this.bookDetails.rss_url;
    result.skip = this.bookDetails.skip;
    result.start_chapter = this.bookDetails.start_chapter;
    result.style = this.bookDetails.style;
    result.processor = this.bookDetails.processor;
    result.rating = this.bookDetails.rating;

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
    this.volumeService.updateBook(def)
      .pipe(first())
      .subscribe(
        {
          next: data => {
            if (data) {
              if (data.message) {
                this._snackBar.open(data.message, undefined, {
                  duration: 3000
                });
              }
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }

  processor_changed() {
    for (let item of this.processors) {
      if (item.id === this.bookDetails.processor) {
        this.selected_processor = item;
        break;
      }
    }
  }

  showRss(): boolean {
    return this.selected_processor.rss;
  }

  showStartId(): boolean {
    return this.selected_processor.startId;
  }

  showBaseUrl(): boolean {
    return this.selected_processor.baseUrl;
  }

}
