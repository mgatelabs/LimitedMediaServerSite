import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CommonResponseInterface, Utility } from './utility';

export interface UserDefinition {
  id: number;
  username: string;
  features: number;
  volume_limit: number;
  media_limit: number;
  group_id: number;
}

export interface GroupDefinition {
  id: number;
  name: string;
  description: string;
}

export interface HardSessionItem {
  id: number;
  uid: number;
  created: string;
  last: string;
  expired: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private authService: AuthService) {

  }

  listHardSessions(mySessionsOnly: boolean): Observable<HardSessionItem[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, hard_sessions: HardSessionItem[] }>(mySessionsOnly ? '/api/admin/list/my/hard_sessions' : '/api/admin/list/hard_sessions', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<HardSessionItem[]>(response, 'hard_sessions'))
      );
  }

  removeHardSession(session_id: number, mySessionsOnly: boolean): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("session_id", session_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>(mySessionsOnly ? '/api/admin/remove/my/hard_session': '/api/admin/remove/hard_session', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  listUsers(): Observable<UserDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, users: UserDefinition[] }>('/api/admin/list/users', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<UserDefinition[]>(response, 'users'))
      );
  }

  listGroups(): Observable<GroupDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, users: GroupDefinition[] }>('/api/admin/list/groups', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<GroupDefinition[]>(response, 'groups'))
      );
  }

  getUserById(user_id: number): Observable<UserDefinition> {
    const formData = new FormData();
    formData.append("user_id", user_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, user: UserDefinition }>('/api/admin/get/user', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<UserDefinition>(response, 'user'))
      );
  }

  getGroupById(group_id: number): Observable<GroupDefinition> {
    const formData = new FormData();
    formData.append("group_id", group_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, group: GroupDefinition }>('/api/admin/get/group', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<GroupDefinition>(response, 'group'))
      );
  }

  removeUserById(user_id: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("user_id", user_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/remove/user', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  removeGroupById(group_id: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("group_id", group_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/remove/group', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  newUser(username: string, password: string, features: number, volume_limit:number, media_limit: number, group_id?: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("features", features.toString());
    formData.append("volume_limit", volume_limit.toString());
    formData.append("media_limit", media_limit.toString());
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/new/user', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  newGroup(name: string, description: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/new/group', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  updateUserLimitsById(user_id: number, features: number, volume_limit:number, media_limit: number, group_id?: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("user_id", user_id.toString());
    formData.append("features", features.toString());
    formData.append("volume_limit", volume_limit.toString());
    formData.append("media_limit", media_limit.toString());
    if (group_id) {
      formData.append("group_id", group_id.toString());
    }
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/update/user/limits', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  updateUserPasswordById(user_id: number, password: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("user_id", user_id.toString());
    formData.append("new_password", password.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/update/user/password', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

  updateMyPassword(old_password: string, password: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("old_password", old_password.toString());
    formData.append("new_password", password.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/update/my/password', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response))
      );
  }

}
