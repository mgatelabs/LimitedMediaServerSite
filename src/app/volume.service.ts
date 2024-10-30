import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CommonResponse, CommonResponseInterface } from './utility';
import { ProcessResponse } from './process.service';
import { Utility } from './utility';
import { PagingInfo } from './media.service';

export interface BookmarkDefinition {
  id: number;
  book: string;
  chapter: string;
  page: string;
  progress: string;
}

export interface ProcessorDefinition {
  id: string;
  name: string;
  pageDescription: string;
  baseUrl: boolean;
  baseUrlDescription: string;
  startId: boolean;
  startIdDescription: string;
  rss: boolean;
  rssDescription: string;
}

export interface ViewedResponse {
  viewed: Map<string, string>;
  history: HistoryData[];
}

export interface BookDefinition {
  id: string;
  name: string;
  extra_url: string;
  start_chapter: string;
  rating: number;
  processor: string;
  info_url: string;
  rss_url: string;
  skip: string;
  style: 'page' | 'scroll';
  active: boolean;
  tags: string[];
}

export interface ChapterData {
  style: string;
  chapters: string[];
}

export interface BookData {
  json: string;
  id: string;
  name: string;
  first: string;
  last: string;
  cover: string;
  date: string;
  tags: string[];
  skip: string;
  style: 'page' | 'scroll';
  restricted: boolean;
  active: boolean;
  rating: number;
}

export interface ChunkData {
  chapterEnd: string;
  chapterStart: string,
  chapters: string[],
  title: string
}

export interface NavData {
  book: string;
  chapter: string;
  next: string;
  prev: string;
  mode: string;
}

export interface HistoryData {
  book: string;
  chapter: string;
  page: string;
  mode: string;
  timestamp?: number;
}

export interface FilesData {
  next: string;
  prev: string;
  files: string[];
}

export interface BookSearch {
  books: BookData[];
  paging: PagingInfo;
}

@Injectable({
  providedIn: 'root'
})
export class VolumeService {

  private navSubject = new BehaviorSubject<NavData>({ book: "", chapter: "", next: '', prev: '', mode: '' });
  public navData$ = this.navSubject.asObservable();

  private historyData: HistoryData[] = []

  private historySubject = new BehaviorSubject<HistoryData[]>([]);
  public historyData$ = this.historySubject.asObservable();

  private viewedSubject = new BehaviorSubject<Map<string, string>>(new Map());
  public viewedData$ = this.viewedSubject.asObservable();

  private viewed: Map<string, string> = new Map();

  public stale: boolean = true;

  private historyPrefix: string = '';

  constructor(private http: HttpClient, private authService: AuthService) {

    this.authService.sessionData$.subscribe(data => {
      if (this.authService.isLoggedIn()) {
        this.historyPrefix = data.session.username + '_';

        let historyStr = localStorage.getItem(this.historyPrefix + 'recent-history');

        if (historyStr) {
          this.historyData = JSON.parse(historyStr);
          this.historyData.forEach(data => {
            if (!data.timestamp) {
              data.timestamp = Date.now();
            }
          });

          this.historySubject.next(this.historyData);
        }

        let viewedStr = localStorage.getItem('viewed');

        if (viewedStr) {
          this.viewed = this.jsonObjectToMap(JSON.parse(viewedStr));
          this.viewedSubject.next(this.viewed);
        }

      } else {
        this.historyPrefix = '';
        this.historyData = [];
        this.historySubject.next(this.historyData);
      }
    });
  }

  private jsonObjectToMap(json: { [key: string]: any }): Map<string, string> {
    const map = new Map<string, any>();
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        map.set(key, json[key]);
      }
    }
    return map;
  }

  mapToJson(map: Map<string, string>): string {
    // Convert the map to an object
    const obj: { [key: string]: string } = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });

    // Convert the object to a JSON string
    return JSON.stringify(obj);
  }

  clearHistory() {
    this.historyData = [];

    localStorage.setItem(this.historyPrefix + 'recent-history', JSON.stringify(this.historyData))

    this.historySubject.next(this.historyData);
  }

  navigated(book: string, chapter: string, nextChapter: string = '', previousChapter: string = '', mode: string = 'page') {
    this.navSubject.next({ book: book, chapter: chapter, next: nextChapter, prev: previousChapter, mode: mode });

    if (chapter && book) {
      // Remove same item
      this.historyData = this.historyData.filter(item => item.book !== book);

      this.historyData.unshift({ book: book, chapter: chapter, page: "0", mode: mode, timestamp: Date.now() });

      // Ensure the history list does not exceed the maximum size
      if (this.historyData.length > 25) {
        // Remove the last item if the size exceeds the maximum
        this.historyData.pop();
      }

      localStorage.setItem(this.historyPrefix + 'recent-history', JSON.stringify(this.historyData))

      this.historySubject.next(this.historyData);
    }
  }

  updateHistory(book: string, chapter: string, page: string, mode: string) {
    if (chapter && book && page && mode) {
      this.historyData = this.historyData.filter(item => item.book !== book);
      this.historyData.unshift({ book: book, chapter: chapter, page: page, mode: mode, timestamp: Date.now() });
      // Ensure the history list does not exceed the maximum size
      if (this.historyData.length > 25) {
        // Remove the last item if the size exceeds the maximum
        this.historyData.pop();
      }
      localStorage.setItem(this.historyPrefix + 'recent-history', JSON.stringify(this.historyData))

      this.historySubject.next(this.historyData);
    }
  }

  private extractDecimalFromString(input: string): number {
    // Remove all characters except digits and period
    const cleanedString = input.replace(/[^\d.]/g, '');

    // Parse the cleaned string as a decimal number
    const decimalNumber = parseFloat(cleanedString);

    // If the parsed number is NaN, return 0
    if (isNaN(decimalNumber)) {
      return 0;
    }

    return decimalNumber;
  }

  public processChapterNameWithProgress(input: string): [string, string] {
    // Initialize portionA and portionB
    let portionA = "";
    let portionB = "0";

    // Check if the input contains the '^' character
    if (input.includes('^')) {
      const parts = input.split('^');
      portionA = parts[0];
      portionB = parts[1] || "0";
    } else {
      portionA = input;
    }

    return [portionA, portionB];
  }

  public processChapterWithProgress(input: string): [string, string] {
    // Initialize portionA and portionB
    let portionA = "";
    let portionB = "0";

    // Check if the input contains the '^' character
    if (input.includes('^')) {
      const parts = input.split('^');
      portionA = parts[0];
      portionB = parts[1] || "0";
    } else {
      portionA = input;
    }

    // Strip out all non-decimal characters from portionA
    portionA = portionA.replace(/[^0-9.]/g, '');

    return [portionA, portionB];
  }

  private mapToJsonObject(map: Map<string, string>): { [key: string]: any } {
    const jsonObject: { [key: string]: any } = {};
    map.forEach((value, key) => {
      jsonObject[key.toString()] = value;
    });
    return jsonObject;
  }

  chapterFinished(bookId: string, chapterId: string, progress: string = '0') {

    let allowUpdate = false;

    if (this.viewed.has(bookId)) {

      const existingProgress = this.processChapterWithProgress(this.viewed.get(bookId) || '0.0');
      const lastChapterString = existingProgress[0];
      const lastProgressString = existingProgress[1];

      const lastChapter = this.extractDecimalFromString(lastChapterString);
      const lastProgress = this.extractDecimalFromString(lastProgressString);

      const currentChapter = this.extractDecimalFromString(chapterId);
      const currentprogress = this.extractDecimalFromString(progress);

      if (currentChapter > lastChapter || (currentChapter == lastChapter && currentprogress > lastProgress)) {
        allowUpdate = true;
      }
    } else {
      allowUpdate = true;
    }

    if (allowUpdate) {
      if (progress.length > 0) {
        this.viewed.set(bookId, chapterId + '^' + progress);
      } else {
        this.viewed.set(bookId, chapterId);
      }
      localStorage.setItem('viewed', JSON.stringify(this.mapToJsonObject(this.viewed)));
      this.viewedSubject.next(this.viewed);
    }
  }

  fetchBooks(rating_limit: number = 0, filter_text: string = '', offset: number = 0, limit:number = 100, sorting: string = 'AZ'): Observable<BookSearch> {
    const formData = new FormData();
    formData.append("offset", offset.toString());
    formData.append("limit", limit.toString());
    formData.append("rating", rating_limit.toString());
    formData.append("sort", sorting);
    formData.append("filter_text", filter_text);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, books: BookData[], paging: PagingInfo}>('/api/volume/list/books', formData, { headers })
      .pipe(
      
        map(response => Utility.handleCommonResponseMap<BookSearch>(response, data => ({ books: data['books'] as BookData[], paging: data['paging'] as PagingInfo }))),
        catchError(Utility.handleCommonError)
      
      );
  }

  fetchChapters(json_name: string): Observable<ChapterData> {
    const formData = new FormData();
    formData.append("book_id", json_name);
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, chapters?: string[], style?: string }>('/api/volume/list/chapters', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<ChapterData>(response, data => ({ chapters: data['chapters'] as string[], style: data['style'] as string })))
      );
  }

  fetchProcessors(): Observable<ProcessorDefinition[]> {

    const formData = new FormData();
    const headers = this.authService.getAuthHeader();

    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, processors?: ProcessorDefinition[] }>('/api/volume/list/processors', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<ProcessorDefinition[]>(response, 'processors'))
      );
  }

  fetchBookmarks(book_id: string = ''): Observable<BookmarkDefinition[]> {

    const formData = new FormData();
    formData.append("book_id", book_id);

    const headers = this.authService.getAuthHeader();

    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, items?: BookmarkDefinition[] }>('/api/volume/bookmarks/list', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<BookmarkDefinition[]>(response, 'items'))
      );
  }

  addBookmark(book: string, chapter: string, page: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("book_id", book);
    formData.append("chapter_id", chapter);
    formData.append("page_number", page);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/volume/bookmarks/add', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  removeBookmark(row_id: number): Observable<CommonResponse> {
    const formData = new FormData();
    formData.append("row_id", row_id.toString());
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponse>('/api/volume/bookmarks/remove', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  fetchBookDetails(json_name: string): Observable<BookDefinition> {
    const formData = new FormData();
    formData.append("book_id", json_name);
    const headers = this.authService.getAuthHeader();

    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, info?: BookmarkDefinition }>('/api/volume/details', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<BookDefinition>(response, 'info'))
      );
  }

  fetchImages(book_id: string, chapter_id: string): Observable<FilesData> {
    const formData = new FormData();
    formData.append("book_id", book_id);
    formData.append("chapter_id", chapter_id);
    const headers = this.authService.getAuthHeader();

    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, prev?: string, next?: string, files?: string[] }>('/api/volume/list/images', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<FilesData>(response, data => ({ prev: data['prev'] as string, next: data['next'] as string , files: data['files'] as string[] })))
      );
  }

  addBook(book: BookDefinition): Observable<CommonResponse> {
    const formData = new FormData();


    formData.append("id", book.id);
    formData.append("name", book.name);
    formData.append("processor", book.processor);
    formData.append("active", book.active ? 'true' : 'false');
    formData.append("info_url", book.info_url);
    formData.append("rss_url", book.rss_url);
    formData.append("extra_url", book.extra_url);
    formData.append("start_chapter", book.start_chapter);
    formData.append("skip", book.skip);
    formData.append("rating", book.rating.toString());
    formData.append("tags", book.tags.join(','));
    formData.append("style", book.style);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponse>('/api/volume/new', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  updateBook(book: BookDefinition): Observable<CommonResponse> {
    const formData = new FormData();

    formData.append("id", book.id);
    formData.append("name", book.name);
    formData.append("processor", book.processor);
    formData.append("active", book.active ? 'true' : 'false');
    formData.append("info_url", book.info_url);
    formData.append("rss_url", book.rss_url);
    formData.append("extra_url", book.extra_url);
    formData.append("start_chapter", book.start_chapter);
    formData.append("skip", book.skip);
    formData.append("rating", book.rating.toString());
    formData.append("tags", book.tags.join(','));
    formData.append("style", book.style);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponse>('/api/volume/update', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  syncViewed(): Observable<ViewedResponse> {
    const formData = new FormData();
    formData.append('viewed', this.mapToJson(this.viewed));
    formData.append('history', JSON.stringify(this.historyData));
    const headers = this.authService.getAuthHeader();

    return this.http.post<{ status: string, message: string, viewed?: Map<string, string>, history?: HistoryData[] }>('/api/volume/viewed', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<ViewedResponse>(response, data => ({ viewed: data['viewed'] as Map<string, string>, history: data['history'] as HistoryData[] })))
      );
  }

  updateViewed(newData: any, history: HistoryData[]) {
    this.viewed = this.jsonObjectToMap(newData);
    localStorage.setItem('viewed', JSON.stringify(this.mapToJsonObject(this.viewed)));
    this.viewedSubject.next(this.viewed);

    this.historyData = history;
    localStorage.setItem(this.historyPrefix + 'recent-history', JSON.stringify(this.historyData))
    this.historySubject.next(this.historyData);

  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return [];
  }

  private handleStatusError(error: any) {
    console.error('An error occurred', error);
    const transformedErrorData = ({ 'status': 'FAIL', 'message': error });
    return throwError(() => transformedErrorData);
  }

  private isValidValue(value: string): boolean {
    const regex = /^[A-Za-z0-9-_]{5,128}$/;
    return regex.test(value);
  }

  public validateBookDefinition(book: BookDefinition, processor: ProcessorDefinition): string[] {

    let result: string[] = [];

    if (book.id && this.isValidValue(book.id) && book.id.length >=5 && book.id.length <= 128) {

    } else {
      result.push('Error: Book ID is needed or invalid');
    }

    if (book.name) {

    } else {
      result.push('Error: Book Name is needed');
    }

    if (book.info_url) {

    } else {
      result.push('Error: Book Url is needed');
    }

    if (book.rss_url) {

    } else if (processor.rss) {
      result.push('Error: Book RSS is needed');
    }

    if (book.start_chapter) {

    } else if (processor.startId) {
      result.push('Error: Book Start is needed');
    }

    if (book.extra_url) {

    } else if (processor.baseUrl) {
      result.push('Error: Book Base Url is needed');
    }

    return result;
  }

  
}
