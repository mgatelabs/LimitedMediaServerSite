import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CommonResponse, CommonResponseInterface } from './utility';
import { Utility } from './utility';
import { PagingInfo } from './media.service';
import { NoticeService } from './notice.service';

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

export interface LatestInfo {
  chapter: string;
  value: string;
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

export interface ChapterInfo {
  name: string,
  value: string;
}

export interface ChapterData {
  style: string;
  info_url: string;
  chapters: ChapterInfo[];
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
  recent?: LatestInfo
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
  name: string;
  book: string;
  chapter: string;
  page: string;
  mode: string;
  timestamp?: string;
}

export interface FilesData {
  next: string;
  prev: string;
  files: string[];
  style: string;
}

export interface ChapterFileItem {
  filename: string,
  selected: boolean
}

export interface ChapterFilesData {
  next: string;
  prev: string;
  files: ChapterFileItem[];
}

export interface BookSearch {
  books: BookData[];
  paging: PagingInfo;
}

@Injectable({
  providedIn: 'root'
})
export class VolumeService {

  public stale: boolean = true;


  constructor(private http: HttpClient, private authService: AuthService) {

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

  uploadProgress(book_id: string, chapter_id: string, progress: string = "0") {
    const formData = new FormData();
    formData.append("book_id", book_id);
    formData.append("chapter_id", chapter_id);
    formData.append("value", progress);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/volume/progress', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  fetchHistory(): Observable<HistoryData[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, history: HistoryData[] }>('/api/volume/list/history', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<HistoryData[]>(response, 'history')),
        catchError(Utility.handleCommonError)
      );
  }

  fetchBooks(rating_limit: number = 0, filter_text: string = '', offset: number = 0, limit: number = 100, sorting: string = 'AZ'): Observable<BookSearch> {
    const formData = new FormData();
    formData.append("offset", offset.toString());
    formData.append("limit", limit.toString());
    formData.append("rating", rating_limit.toString());
    formData.append("sort", sorting);
    formData.append("filter_text", filter_text);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, books: BookData[], paging: PagingInfo }>('/api/volume/list/books', formData, { headers })
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
    return this.http.post<{ status: string, message: string, chapters?: ChapterInfo[], style?: string }>('/api/volume/list/chapters', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<ChapterData>(response, data => ({ chapters: data['chapters'] as ChapterInfo[], style: data['style'] as string, info_url: data['info_url'] as string })))
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

  // Editor

  removeImage(book_id: string, chapter_id: string, file_name: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("book_id", book_id);
    formData.append("chapter_id", chapter_id);
    formData.append("file_name", file_name);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/volume/remove/image', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  mergeImage(book_id: string, chapter_id: string, file_name: string, alt_file_name: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("book_id", book_id);
    formData.append("chapter_id", chapter_id);
    formData.append("file_name", file_name);
    formData.append("alt_file_name", alt_file_name);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/volume/merge/image', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  splitImage(book_id: string, chapter_id: string, file_name: string, position: number, is_horizontal: boolean, keep_first: boolean): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("book_id", book_id);
    formData.append("chapter_id", chapter_id);
    formData.append("file_name", file_name);

    formData.append("position", position.toString());
    formData.append("is_horizontal", is_horizontal ? 'true' : 'false');
    formData.append("keep_first", keep_first ? 'true' : 'false');

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/volume/split/image', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  // Bookmarks

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
        map(response => Utility.handleCommonResponseMap<FilesData>(response, data => ({ prev: data['prev'] as string, next: data['next'] as string, files: data['files'] as string[], style: data['style'] as string })))
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

  removeBook(book_id: string, noticeService: NoticeService): Observable<CommonResponse> {
    const formData = new FormData();
    formData.append("id", book_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponse>('/api/volume/remove', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  private isValidValue(value: string): boolean {
    const regex = /^[A-Za-z0-9-_]{5,128}$/;
    return regex.test(value);
  }

  public validateBookDefinition(book: BookDefinition, processor: ProcessorDefinition): string[] {

    let result: string[] = [];

    if (book.id && this.isValidValue(book.id) && book.id.length >= 5 && book.id.length <= 128) {

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
