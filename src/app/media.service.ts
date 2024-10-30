import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { CommonResponseInterface, Utility } from './utility';
import { GroupDefinition } from './user.service';

export interface NodeDefinition {
  id: string;
  name: string;
  rating: number;
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
}

export interface FileInfo extends NamedInfo {
  id: string,
  filesize: number,
  preview: boolean,
  mime_type: string,
  archive: boolean,
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

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  constructor(private http: HttpClient, private authService: AuthService) {

  }

  fetchMedia(folder_id: string = '', rating_limit: number = 0, filter_text: string = '', offset: number = 0, limit:number = 100, sorting: string = 'AZ'): Observable<MediaInfo> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("offset", offset.toString());
    formData.append("limit", limit.toString());
    formData.append("rating", rating_limit.toString());
    formData.append("sort", sorting);
    formData.append("filter_text", filter_text);
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: CurrentInfo, paging: PagingInfo, folders: FolderInfo[], files: FileInfo[] }>('/api/media/list', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<MediaInfo>(response, data => ({ info: data['info'] as CurrentInfo, paging: data['paging'] as PagingInfo, folders: data['folders'] as FolderInfo[], files: data['files'] as FileInfo[] }))),
        catchError(Utility.handleCommonError)
      );
  }

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

  deleteFile(file_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/delete', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  migrateFile(file_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/file/migrate', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  postFolder(parent_id: string, name: string, info_url: string, tags: string, rating: number, active: boolean, group_id?: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("parent_id", parent_id);
    formData.append("name", name);
    formData.append("rating", rating.toString());
    formData.append("info_url", info_url);
    formData.append("active", active ? 'true' : 'false');
    formData.append("tags", tags);
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/folder/post', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  putFolder(folder_id: string, name: string, info_url: string, tags: string, rating: number, active: boolean, group_id?: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    formData.append("name", name);
    formData.append("rating", rating.toString());
    formData.append("info_url", info_url);
    formData.append("active", active ? 'true' : 'false');
    formData.append("tags", tags);
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/folder/put', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  putFile(file_id: string, filename: string, mime_type: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("file_id", file_id);
    formData.append("filename", filename);
    formData.append("mime_type", mime_type);

    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/file/put', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  deleteFolder(folder_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();

    return this.http.post<CommonResponseInterface>('/api/media/folder/delete', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  uploadFileForFolder(folder_id: string, file: File): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('folder_id', folder_id);
    formData.append('file', file);
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/media/folder/upload/file', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  uploadPreviewForFolder(folder_id: string, file: File): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('folder_id', folder_id);
    formData.append('image', file);

    const headers = this.authService.getAuthHeader();

    return this.http.post<any>('/api/media/folder/upload/preview', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response)),
        catchError(Utility.handleCommonError)
      );
  }

  // Nodes

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

  listGroups(): Observable<GroupDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, users: GroupDefinition[] }>('/api/media/list/groups', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<GroupDefinition[]>(response, 'groups'))
      );
  }
}
