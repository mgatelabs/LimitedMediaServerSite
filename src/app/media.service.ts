import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, EMPTY, map, Observable } from 'rxjs';
import { CommonResponse, CommonResponseInterface, Utility } from './utility';
import { GroupDefinition } from './user.service';
import { NoticeService } from './notice.service';
import { MediaFolderTag, MediaFolderTagService } from './media-folder-tag.service';
import { TrackingService } from './tracking.service';

export interface NodeDefinition {
  id: string;
  name: string;
  rating: number;
}

export interface UnsafeDefinition {
  file_id: string;
  token: string;
}

export interface MediaFolderDefinition {
  id: string;
  name: string;
  rating: number;
  preview: boolean;
  active: boolean;
  parent_id: string;
  tags: string;
  created: string;
  updated: string;
  info_url: string;
  fast_tags: number[],
  parent_rating: number;
  parent_group?: number;
  group_id?: number;
}

export interface MediaFileDefinition {
  id: string;
  filename: string;
  filesize: number;
  mime_type: string;
  preview: boolean;
  archive: boolean;
  created: string;
}

export interface CurrentInfo {
  id: string,
  name: string,
  info_url: string,
  rating: number,
  created: string,
  preview: boolean,
  active: boolean,
  parent: string,
}

export interface NamedInfo {
  name: string,
  created: string,
  updated: string,
}

export interface FolderInfo extends NamedInfo {
  id: string,
  rating: number,
  preview: boolean,
  active: boolean,
  info_url: string,
  fast_tags: number[]
}

export interface FileInfo extends NamedInfo {
  id: string,
  filesize: number,
  preview: boolean,
  mime_type: string,
  archive: boolean,
  progress?: string
}

export interface FileRefInfo {
  id: string,
  name: string,
  folder: boolean
}

export interface HistoryInfo {
  folder_name: string,
  file_id: string,
  folder_id: string,
  name: string,
  mime_type: string,
  preview: boolean,
  progress?: string,
  timestamp: string,
}

export interface PagingInfo {
  total: number;
  offset: number;
}

export interface MediaInfo {
  info: CurrentInfo,
  paging: PagingInfo,
  folders: FolderInfo[],
  files: FileInfo[],
}

export interface MediaContainer {
  is_folder: boolean;
  name: string,
  id: string,
  filesize: number,
  created: string,
  updated: string,
  folder: FolderInfo | undefined;
  file: FileInfo | undefined;
  selected?: boolean;
}

export interface MediaPlaylist {
  files: FileInfo[],
  start_index: number
}

export interface MediaKeyValueDefinition {
  id: number;
  folder: string;
  key: string;
  value: string;
  purpose: number;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  private readonly tagMapSubject =
    new BehaviorSubject<Map<number, MediaFolderTag>>(new Map());

  readonly tagMap$ = this.tagMapSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService, private tagService: MediaFolderTagService, private trackingService: TrackingService) {
    // console.log('MediaService Alive');
    this.tagService.tags$
      .pipe(
        map(info => this.toMap(info.tags))
      )
      .subscribe(map => this.tagMapSubject.next(map));
  }

  /** Retrieve a paginated list of files created within a date range. */
  fetchMediaByDate(start_date: string, end_date: string, rating_limit: number = 0, offset: number = 0, limit: number = 20, sorting: string = 'DA'): Observable<MediaInfo> {
    const formData = new FormData();
    formData.append("start_date", start_date);
    formData.append("end_date", end_date);
    formData.append("offset", offset.toString());
    formData.append("limit", limit.toString());
    formData.append("rating", rating_limit.toString());
    formData.append("sort", sorting);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: CurrentInfo, paging: PagingInfo, folders: FolderInfo[], files: FileInfo[] }>('/api/media/list/by-date', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<MediaInfo>(response, data => ({ info: data['info'] as CurrentInfo, paging: data['paging'] as PagingInfo, folders: data['folders'] as FolderInfo[], files: data['files'] as FileInfo[] }))),
        catchError(Utility.handleCommonError)
      );
  }

  /** Retrieve a paginated list of folders and files for the given folder, with optional filtering and sorting. */
  fetchMedia(folder_id: string = '', rating_limit: number = 0, filter_text: string = '', offset: number = 0, limit: number = 100, sorting: string = 'AZ', required_tags: number[] = [], hidden_tags: number[] = []): Observable<MediaInfo> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("offset", offset.toString());
    formData.append("limit", limit.toString());
    formData.append("rating", rating_limit.toString());
    formData.append("sort", sorting);
    formData.append("filter_text", filter_text);
    formData.append("required_tags", required_tags.join(','));
    formData.append("hidden_tags", hidden_tags.join(','));
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: CurrentInfo, paging: PagingInfo, folders: FolderInfo[], files: FileInfo[] }>('/api/media/list', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<MediaInfo>(response, data => ({ info: data['info'] as CurrentInfo, paging: data['paging'] as PagingInfo, folders: data['folders'] as FolderInfo[], files: data['files'] as FileInfo[] }))),
        catchError(Utility.handleCommonError)
      );
  }

  /** Fetch full details for a single media folder. */
  fetchFolder(folder_id: string): Observable<MediaFolderDefinition> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: MediaFolderDefinition }>('/api/media/folder', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<MediaFolderDefinition>(response, "info")),
        catchError(Utility.handleCommonError)
      );
  }

  /** Fetch full details for a single media file. */
  fetchFile(file_id: string): Observable<MediaFileDefinition> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: MediaFileDefinition }>('/api/media/file', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<MediaFileDefinition>(response, "file")),
        catchError(Utility.handleCommonError)
      );
  }

  /** Retrieve the raw text content of a file. */
  fetchFileText(file_id: string): Observable<string> {
    const params = new HttpParams().set('file_id', file_id);
    return this.http.get('/api/media/view', {
      params,
      responseType: 'text',
      withCredentials: true // important if auth is cookie-based
    }).pipe(
      catchError(Utility.handleCommonError)
    );
  }

  /** Delete a media file from its current folder. */
  deleteFile(file_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/delete', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Move a media file into the destination folder. */
  moveFile(file_id: string, folder_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/move', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Move a media folder into the destination parent folder. */
  moveFolder(source_id: string, folder_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("source_id", source_id);
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/folder/move', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Trigger file migration (re-ingest metadata), optionally forcing archive. */
  migrateFile(file_id: string, force_archive: boolean = false): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    formData.append("force_archive", force_archive ? 'true' : 'false');
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/migrate', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Create a new media folder under the given parent. */
  postFolder(parent_id: string, name: string, info_url: string, tags: string, fast_tags: string, rating: number, active: boolean, group_id?: number): Observable<string> {
    const formData = new FormData();
    formData.append("parent_id", parent_id);
    formData.append("name", name);
    formData.append("rating", rating.toString());
    formData.append("info_url", info_url);
    formData.append("active", active ? 'true' : 'false');
    formData.append("tags", tags);
    formData.append("fast_tags", fast_tags);
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();

    return this.http.post<{ status: string, message: string, folder_id: string }>('/api/media/folder/post', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<string>(response, 'folder_id', this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Update an existing media folder's properties. */
  putFolder(folder_id: string, name: string, info_url: string, tags: string, fast_tags: string, rating: number, active: boolean, group_id?: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("name", name);
    formData.append("rating", rating.toString());
    formData.append("info_url", info_url);
    formData.append("active", active ? 'true' : 'false');
    formData.append("tags", tags);
    formData.append("fast_tags", fast_tags);
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/folder/put', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Update an existing media file's metadata (filename, mime type). */
  putFile(file_id: string, filename: string, mime_type: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    formData.append("filename", filename);
    formData.append("mime_type", mime_type);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/file/put', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Delete a media folder and all files within it. */
  deleteFolder(folder_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/folder/delete', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Upload a file into the given media folder. */
  uploadFileForFolder(folder_id: string, file: File): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('folder_id', folder_id);
    formData.append('file', file);
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/media/folder/upload/file', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Upload a preview image into the given media folder. */
  uploadPreviewForFolder(folder_id: string, file: File): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('folder_id', folder_id);
    formData.append('image', file);

    const headers = this.authService.getAuthHeader();

    return this.http.post<any>('/api/media/folder/upload/preview', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Send a note attached to (or created in) the given folder. */
  uploadNoteForFolder(folder_id: string, note_text: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('folder_id', folder_id);
    formData.append('note_text', note_text);
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/media/folder/upload/note', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }
  // Folder Keys

  /** Retrieve all key/value rows stored for a folder. */
  fetchFolderKeys(folder_id: string): Observable<MediaKeyValueDefinition[]> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, items?: MediaKeyValueDefinition[] }>('/api/media/keys/list', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<MediaKeyValueDefinition[]>(response, 'items')),
        catchError(Utility.handleCommonError)
      );
  }

  /** Retrieve a single key/value row for a folder. */
  fetchFolderKey(folder_id: string, row_id: number): Observable<MediaKeyValueDefinition> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("row_id", row_id.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info?: MediaKeyValueDefinition }>('/api/media/keys/get', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<MediaKeyValueDefinition>(response, 'info')),
        catchError(Utility.handleCommonError)
      );
  }

  /** Add a key/value row for a folder. */
  addFolderKey(folder_id: string, key: string, value: string = '', purpose: number = 1): Observable<CommonResponse> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("key", key);
    formData.append("value", value);
    formData.append("purpose", purpose.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponse>('/api/media/keys/insert', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response) as CommonResponse),
        catchError(Utility.handleCommonError)
      );
  }

  /** Update an existing key/value row for a folder. The key is locked and cannot be modified. */
  updateFolderKey(folder_id: string, row_id: number, value: string, purpose: number | null = null): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("row_id", row_id.toString());
    formData.append("value", value);
    if (purpose !== null) {
      formData.append("purpose", purpose.toString());
    }
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/keys/update', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Remove a key/value row for a folder. */
  removeFolderKey(folder_id: string, row_id: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("row_id", row_id.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/keys/delete', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Request an unsafe stream token so media can be played on other devices. */
  getUnsafeToken(file_id: string): Observable<UnsafeDefinition> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, file_id: string, token: string }>('/api/media/request-unsafe-stream', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<UnsafeDefinition>(response, data => ({ file_id: file_id, token: data['cache_id'] as string }))),
        catchError(Utility.handleCommonError)
      );
  }

  // Progress

  /** Update playback progress for a tracked file. */
  putProgress(file_id: string, progress: string): Observable<CommonResponseInterface> {
    if (!this.trackingService.enabled) return EMPTY;
    const formData = new FormData();
    formData.append("file_id", file_id);
    formData.append("progress", progress);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/progress', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  // Status Change

  /** Activate or inactivate a media folder. */
  updateFolderStatus(folder_id: string, activate: boolean): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/folder/' + (activate ? "activate" : "inactivate"), formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  // Nodes

  /** Retrieve a list of folders for choosing a destination folder during navigation. */
  fetchNodes(folder_id: string = ''): Observable<NodeDefinition[]> {
    const formData = new FormData();
    formData.append("node_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, nodes: NodeDefinition[] }>('/api/media/nodes', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<NodeDefinition[]>(response, 'nodes')),
        catchError(Utility.handleCommonError)
      );
  }

  /** Retrieve the parent folder of a given folder for navigation purposes. */
  fetchNode(folder_id: string = ''): Observable<NodeDefinition> {
    const formData = new FormData();
    formData.append("node_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, node: NodeDefinition }>('/api/media/node', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<NodeDefinition>(response, 'node')),
        catchError(Utility.handleCommonError)
      );
  }

  // History

  /** Fetch available groups/folders for organizational navigation. */
  listGroups(): Observable<GroupDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, users: GroupDefinition[] }>('/api/media/list/groups', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<GroupDefinition[]>(response, 'groups'))
      );
  }

  // History

  /** Fetch recent history of viewed/used media items. */
  listHistory(): Observable<HistoryInfo[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, history: HistoryInfo[] }>('/api/media/list/history', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<HistoryInfo[]>(response, 'history'))
      );
  }

  // Tags

  /** Reactive access */
  getTags(): Observable<Map<number, MediaFolderTag>> {
    return this.tagMap$;
  }

  /** Snapshot access (optional, but often useful) */
  getTagsSnapshot(): Map<number, MediaFolderTag> {
    return this.tagMapSubject.value;
  }

  private toMap(tags: MediaFolderTag[]): Map<number, MediaFolderTag> {
    return new Map(tags.map(tag => [tag.bit, tag]));
  }

  private tagsInit = false;

  initTags(): void {
    if (this.tagsInit) return;
    this.tagsInit = true;
    this.tagService.fetchTags().subscribe();
  }
}
