import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { SESSION_AUTH } from './constants';
import { SessionInfo } from './session-info';
import { FeatureFlagsService } from './feature-flags.service';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private sessionSubject = new BehaviorSubject<SessionInfo>(new SessionInfo({ username: '', exp: -1 , features: 0, limits: {volume: 0, media: 0}, token: '' }));
  public sessionData$ = this.sessionSubject.asObservable();

  private session: AuthSession = { username: '', exp: -1 , features: 0, limits: {volume: 0, media: 0}, token: ''};
  private SESSION_NAME: string = "sess-2";

  constructor(private http: HttpClient, public features: FeatureFlagsService) {
    this.loadSession();
  }

  private loadSession() {
    let sValue = this.getSessionValue(this.SESSION_NAME);
    if (sValue) {
      // Try to load it from the session 1st
      this.loadTokenFromString(sValue);
    }
  }

  private resetSession() {
    this.session = { username: '', exp: -1 , features: 0, limits: {volume: 0, media: 0}, token: ''};
    this.sessionSubject.next(new SessionInfo(this.session));
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

  private isSessionValid() : boolean {
    if (this.session.token && this.session.username && this.session.exp) {
      const currentTime = Math.floor(Date.now() / 1000);      
      return this.session.exp > currentTime;
    } else {
      console.log(this.session);
    }
    return false;
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

  login(username: string, password: string): Observable<boolean> {

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    // Make POST request to login endpoint
    return this.http.post<any>('/api/auth/login', formData).pipe(
      map(response => {
        // Check if token is present in response
        if (response && response.token) {
          // Store token in session storage
          this.setSessionValue(this.SESSION_NAME, response.token);
          return this.loadTokenFromString(response.token); // Successful login
        }
        return false; // Login failed
      })
    );
  }

  renew(): Observable<boolean> {

    const formData = new FormData();
    const headers = this.getAuthHeader();

    // Make POST request to login endpoint
    return this.http.post<any>('/api/auth/renew', formData, { headers }).pipe(
      map(response => {
        // Check if token is present in response
        if (response && response.token) {
          // Store token in session storage
          this.setSessionValue(this.SESSION_NAME, response.token);
          return this.loadTokenFromString(response.token); // Successful login
        }
        return false; // Login failed
      })
    );
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

  isTokenExpired(token: string): boolean {
    const tokenData = this.parseToken(token);
    if (!tokenData || !tokenData.exp) return true; // Token is invalid or doesn't have expiration
    const currentTime = Math.floor(Date.now() / 1000);
    return tokenData.exp < currentTime;
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

  isFeatureEnabled(feature: number) : boolean {
    return (this.session.features & feature) > 0;
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.isLoggedIn();
}
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthService).canActivate(next, state);
}