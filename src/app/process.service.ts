import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CommonResponse } from './utility';

export interface StatusData {
  id: number;
  name: string;
  description: string;
  progress: number;
  percent: number;
  finished: boolean;
  waiting: boolean;
  worked: boolean;
  failure: boolean;
  warning: boolean;
  log: LogData[];
}

export interface LogData {
  s: number,
  time: number;
  text: string;
}

export interface ProcessResponse extends CommonResponse {
  task_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessService {

  constructor(private http: HttpClient, private authService: AuthService) {

  }

  // Process
  public allProcessStatus(): Observable<StatusData[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<StatusData[]>('/api/process/status/all', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public cleanProcessStatus(): Observable<any> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/process/clean', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public sweepProcessStatus(): Observable<any> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/process/sweep', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public singleProcessStatus(task_id: number): Observable<StatusData> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<StatusData>('/api/process/status/' + task_id, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public cancelProcessStatus(task_id: number): Observable<StatusData> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<StatusData>('/api/process/cancel/' + task_id, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public promoteProcessTask(task_id: number): Observable<StatusData> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<StatusData>('/api/process/promote/' + task_id, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public stopServer(): Observable<any> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/process/stop', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  public restartServer(): Observable<any> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/process/restart', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  runTask(task_name: string, payload: any | undefined): Observable<any> {
    if (!payload) {
      payload = {}      
    }
    payload['task_id'] = task_name;
    const formData = new FormData();
    formData.append('bundle', JSON.stringify(payload));
    const headers = this.authService.getAuthHeader();
    return this.http.post<any>('/api/process/add', formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return [];
  }

  getLoggingIconName(log:LogData) {
    switch (log.s) {
      case 0:
        return 'barefoot';
        case 10:
        return 'bug_report';
        case 20:
        return 'info';
        case 30:
        return 'warning';
        case 40:
        return 'error';
        case 50:
        return 'exclamation';
        case 100:
          default:
          return 'description';
    }
  }

  getLoggingClass(log:LogData) {
    return 'level-' + log.s;
  }

  getStatusDescriptionFor(item: StatusData) {
    if (item.failure) {
      return "Failure";
    } else if (item.warning) {
      return "Warning";
    } else if (item.finished) {
      if (item.worked) {
        return "Finished";
      }
      return "Fruitless completion";
    } else if (item.waiting) {
      return "Waiting";
    }
    return "Running";
  }

  getStatusIconName(item: StatusData) {
    if (item.finished) {
        if (item.failure) {
            return 'error';
        } else if (item.worked) {
            return 'check_finished';
        } else {
            return 'sailing';
        }
    } else if (item.waiting) {
        return 'pending';
    } else {
        return 'play_arrow';
    }    
  }
}


