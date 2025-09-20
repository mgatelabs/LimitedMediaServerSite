import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, map, Observable } from 'rxjs';
import { Utility } from './utility';

export interface MemoryInfo {
  total: number;
  available: number;
  percent: number;
  used: number;
  free: number;
}

export interface SysInfo {
  cpu: number;
  memory: MemoryInfo;
  netout: number;
  netin: number;
}

export interface StorageInfo {
  device: string;
  mountpoint: string;
  fstype: string;
  total: number;
  used: number;
  free: number;
  percent: number;
}


@Injectable({
  providedIn: 'root'
})
export class HealthService {

  constructor(private authService: AuthService, private http: HttpClient) {

  }

  fetchStats(): Observable<SysInfo> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: SysInfo }>('/api/health/status', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<SysInfo>(response, "info")),
        catchError(Utility.handleCommonError)
      );
  }

  fetchDrives(): Observable<StorageInfo[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, info: SysInfo }>('/api/health/drives', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<StorageInfo[]>(response, "info")),
        catchError(Utility.handleCommonError)
      );
  }

}
