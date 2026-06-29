import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { NoticeService } from './notice.service';
import { BehaviorSubject, catchError, filter, map, Observable, tap } from 'rxjs';
import { CommonResponseInterface, Utility } from './utility';

export interface MediaFolderTag {
  bit: number,
  value: number,
  short: string,
  long: string,
  description: string
}



export interface MediaFolderTagDetail {
  tag: MediaFolderTag
}

export interface MediaFolderTagInfo {
  tags: MediaFolderTag[]
}

@Injectable({
  providedIn: 'root'
})
export class MediaFolderTagService {

  private readonly tagsSubject =
    new BehaviorSubject<MediaFolderTagInfo | null>(null);

  readonly tags$ = this.tagsSubject.asObservable().pipe(
    filter((v): v is MediaFolderTagInfo => v !== null)
  );

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService) {
    // console.log('MediaFolderTagService Alive');
  }

  getTag(bit: number): Observable<MediaFolderTagDetail> {
    const formData = new FormData();
    formData.append("bit", bit.toString());
    const headers = this.authService.getAuthHeader();
    // console.log('Fetch Tags');
    return this.http
      .post<{ status: string; message: string; tag: MediaFolderTag }>(
        '/api/media/get/tag',
        formData,
        { headers }
      )
      .pipe(
        map(response =>
          Utility.handleCommonResponseMap<MediaFolderTagDetail>(
            response,
            data => ({ tag: data['tag'] as MediaFolderTag })
          )
        ),
        catchError(Utility.handleCommonError)
      );
  }

  fetchTags(): Observable<MediaFolderTagInfo> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // console.log('Fetch Tags');
    return this.http
      .post<{ status: string; message: string; tags: MediaFolderTagInfo }>(
        '/api/media/list/tags',
        formData,
        { headers }
      )
      .pipe(
        map(response =>
          Utility.handleCommonResponseMap<MediaFolderTagInfo>(
            response,
            data => ({ tags: data['tags'] as MediaFolderTag[] })
          )
        ),
        tap(tags => this.tagsSubject.next(tags)),
        catchError(Utility.handleCommonError)
      );
  }

  /** Call after create/update/delete */
  refresh(): void {
    this.fetchTags().subscribe();
  }

  createTag(tag: MediaFolderTag): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("bit", tag.bit.toString());
    formData.append("short", tag.short);
    formData.append("long", tag.long.toString());
    formData.append("description", tag.description.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/new/tag', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        tap(() => this.refresh()),
        catchError(Utility.handleCommonError)
      );
  }

  updateTag(tag: MediaFolderTag): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("bit", tag.bit.toString());
    formData.append("short", tag.short);
    formData.append("long", tag.long.toString());
    formData.append("description", tag.description.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/update/tag', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        tap(() => this.refresh()),
        catchError(Utility.handleCommonError)
      );
  }

  deleteTag(bit: number): Observable<CommonResponseInterface> {    
    const formData = new FormData();
    formData.append("bit", bit.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/remove/tag', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        tap(() => this.refresh()),
        catchError(Utility.handleCommonError)
      );
  }

  applyTag(bit: number, folder_id: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("bit", bit.toString());
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/apply/tag', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        tap(() => this.refresh()),
        catchError(Utility.handleCommonError)
      );
  }

  detachTag(bit: number, folder_id: string): Observable<CommonResponseInterface> {    
    const formData = new FormData();
    formData.append("bit", bit.toString());
    formData.append("folder_id", folder_id);
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/media/detach/tag', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        tap(() => this.refresh()),
        catchError(Utility.handleCommonError)
      );
  }

}
