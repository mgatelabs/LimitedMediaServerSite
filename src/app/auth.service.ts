import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { SESSION_AUTH } from './constants';
import { SessionInfo } from './session-info';
import { FeatureFlagsService } from './feature-flags.service';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { NoticeService } from './notice.service';
import { CommonResponseInterface } from './utility';

export interface AuthSession {
  username: string;
  exp: number;
  features: number;
  limits: AuthLimitSession;
  token: string
}

export interface AuthLimitSession {
  volume: number;
  media: number;
}

export interface LoginAuthResult extends CommonResponseInterface {
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private sessionSubject = new BehaviorSubject<SessionInfo>(new SessionInfo({ username: '', exp: -1, features: 0, limits: { volume: 0, media: 0 }, token: '' }));
  public sessionData$ = this.sessionSubject.asObservable();

  private session: AuthSession = { username: '', exp: -1, features: 0, limits: { volume: 0, media: 0 }, token: '' };
  private SESSION_NAME: string = "sess-2";
  private HARD_SESSION_NAME: string = "hard_session_token";
  public HARD_SESSION_TOKEN: string = "";

  constructor(private http: HttpClient, public features: FeatureFlagsService, private noticeService: NoticeService) {
    this.loadSession();
  }

  private loadSession() {
    // Hard Session
    this.HARD_SESSION_TOKEN = localStorage.getItem(this.HARD_SESSION_NAME) || '';
    let sValue = this.getSessionValue(this.SESSION_NAME);
    if (sValue) {
      // Try to load it from the session 1st
      this.loadTokenFromString(sValue);
    } else {
      this.resetSession();
    }
  }

  private resetSession() {
    this.session = { username: '', exp: -1, features: 0, limits: { volume: 0, media: 0 }, token: '' };
    this.sessionSubject.next(new SessionInfo(this.session));
  }

  private resendSession() {
    this.sessionSubject.next(new SessionInfo(this.session));
  }

  public cleanHardSession() {
    this.HARD_SESSION_TOKEN = '';
    this.resendSession();
  }

  public hasHardSession() {
    return this.HARD_SESSION_TOKEN.length == 200;
  }

  private loadTokenFromString(token: string): boolean {
    const tokenData = this.parseToken(token);
    // Make sure we have all the values
    if (tokenData && tokenData.exp && tokenData.username && tokenData.limits && tokenData.features >= 0) {
      this.session = {
        username: tokenData.username,
        exp: tokenData.exp,
        limits: tokenData.limits,
        features: tokenData.features,
        token: token
      };
      if (this.isSessionValid()) {
        this.sessionSubject.next(new SessionInfo(this.session));
        return true;
      }
    }
    this.resetSession();
    return false;
  }

  private isSessionValid(): boolean {
    if (this.session.token && this.session.username && this.session.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return this.session.exp > currentTime;
    }
    return false;
  }

  public getSessionTimeRemaining(): number {
    if (this.session.token && this.session.username && this.session.exp) {

      // Calculate time left until expiration (in seconds)
      const expirationTime = this.session.exp * 1000; // convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Return time until expiration in seconds
      return timeUntilExpiration > 0 ? Math.floor(timeUntilExpiration / 1000) : 0;

    } else {
      return 0;
    }
  }

  private getSessionValue(key: string): string {
    if (SESSION_AUTH) {
      return sessionStorage.getItem(key) || '';
    } else {
      return localStorage.getItem(key) || '';
    }
  }

  private setSessionValue(key: string, value: string) {
    if (SESSION_AUTH) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  private removeSessionValue(key: string) {
    if (SESSION_AUTH) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  login(username: string, password: string, token: string, pin: string): Observable<boolean> {

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('token', token);
    formData.append('pin', pin);

    // Make POST request to login endpoint
    return this.http.post<LoginAuthResult>('/api/auth/login', formData).pipe(
      map(response => {
        console.log(response);
        // Check if token is present in response
        if (response && response.token) {
          // Store token in session storage
          this.setSessionValue(this.SESSION_NAME, response.token);
          return this.loadTokenFromString(response.token); // Successful login
        }
        else if (response) {
          this.noticeService.handleResponse(response);
        }
        return false; // Login failed
      }),
      catchError((error: HttpErrorResponse) => {
          this.noticeService.handleError(error);
        return throwError(() => error); // Re-throw the error for further handling if needed
      })
    );
  }

  renew(): Observable<boolean> {

    const formData = new FormData();
    const headers = this.getAuthHeader();

    // Make POST request to login endpoint
    return this.http.post<LoginAuthResult>('/api/auth/renew', formData, { headers }).pipe(
      map(response => {
        // Check if token is present in response
        if (response && response.token) {
          // Store token in session storage
          this.setSessionValue(this.SESSION_NAME, response.token);
          return this.loadTokenFromString(response.token); // Successful renew
        } else if (response) {
          this.noticeService.handleResponse(response);
        }
        return false; // Renew failed
      }),
      catchError((error: HttpErrorResponse) => {
          this.noticeService.handleError(error);
        return throwError(() => error); // Re-throw the error for further handling if needed
      })
    );
  }

  establishHardSession(pin: string, pin2: string): Observable<boolean> {

    const formData = new FormData();
    formData.append('pin', pin);
    formData.append('pin2', pin2);
    const headers = this.getAuthHeader();

    // Make POST request to login endpoint
    return this.http.post<LoginAuthResult>('/api/auth/hard', formData, { headers }).pipe(
      map(response => {
        // Check if token is present in response
        if (response && response.token) {
          // Store token in session storage
          this.HARD_SESSION_TOKEN = response.token;
          // Store it locally
          localStorage.setItem(this.HARD_SESSION_NAME, this.HARD_SESSION_TOKEN);
          this.resendSession();
          return true;
        } else if (response) {
          this.noticeService.handleResponse(response);
        }
        return false; // Renew failed
      }),
      catchError((error: HttpErrorResponse) => {
          this.noticeService.handleError(error);
        return throwError(() => error); // Re-throw the error for further handling if needed
      })
    );
  }

  clearHardSession() {
    this.HARD_SESSION_TOKEN = '';
    // Store it locally
    localStorage.setItem(this.HARD_SESSION_NAME, this.HARD_SESSION_TOKEN);
    this.resendSession();
  }

  logout(): void {
    // Clear token from session storage
    this.removeSessionValue(this.SESSION_NAME);
    this.resetSession();
  }

  getToken(): string | null {
    return this.getSessionValue(this.SESSION_NAME);
  }

  public getAuthHeader(): HttpHeaders {
    // Get token from authentication service
    const token = this.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    // Add token to request headers
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  parseToken(token: string): any {
    try {
      // Assuming token is JWT, you may need to adjust this based on your token format
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.isSessionValid();
  }

  isFeatureEnabled(feature: number): boolean {
    return (this.session.features & feature) > 0;
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.isLoggedIn();
  }

  isAdmin(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & this.features.MANAGE_APP) > 0;
  }

  isPluginExecutor(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.VOLUME_PLUGINS || this.features.MEDIA_PLUGINS || this.features.UTILITY_PLUGINS || this.features.GENERAL_PLUGINS)) > 0;
  }

  isPluginMediaExecutor(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.MEDIA_PLUGINS)) > 0;
  }

  isPluginVolumeExecutor(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.VOLUME_PLUGINS)) > 0;
  }

  isPluginViewer(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.VIEW_PROCESSES)) > 0;
  }

  isVolumeViewer(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.VIEW_VOLUME)) > 0;
  }

  isHardSession(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.HARD_SESSIONS)) > 0;
  }

  isVolumeManager(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.MANAGE_VOLUME)) > 0;
  }

  isMediaViewer(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.VIEW_MEDIA)) > 0;
  }

  isMediaManager(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return (this.session.features & (this.features.MANAGE_MEDIA)) > 0;
  }
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).canActivate(next, state);
}

export const AdminGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isAdmin(next, state);
}

export const PluginExecuteGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isPluginExecutor(next, state);
}

export const PluginMediaExecuteGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isPluginMediaExecutor(next, state);
}

export const PluginVolumeExecuteGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isPluginVolumeExecutor(next, state);
}

export const PluginViewerGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isPluginViewer(next, state);
}

export const VolumeViewerGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isVolumeViewer(next, state);
}

export const VolumeManageGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isVolumeManager(next, state);
}

export const MediaViewerGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isMediaViewer(next, state);
}

export const MediaManageGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isMediaManager(next, state);
}

export const HardSessionGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).isHardSession(next, state);
}