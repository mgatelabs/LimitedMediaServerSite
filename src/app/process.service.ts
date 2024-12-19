import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CommonResponse, CommonResponseInterface, Utility } from './utility';
import { NoticeService } from './notice.service';

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
  logging: number;
  delay_duration: number;
  running_duration: number;
  total_duration: number;
  init_timestamp: string;
  start_timestamp: string;
  end_timestamp: string;
  book_id: string;
  folder_id: string;
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

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService) {

  }

  // Process
  public allProcessStatus(): Observable<StatusData[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, tasks?: StatusData[] }>('/api/process/status/all', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<StatusData[]>(response, "tasks", this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public cleanProcessStatus(): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/clean', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public sweepProcessStatus(): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/sweep', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public singleProcessStatus(task_id: number): Observable<StatusData> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, task?: StatusData }>('/api/process/status/' + task_id, formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<StatusData>(response, "task", this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public cancelProcessStatus(task_id: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/cancel/' + task_id, formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public changeProcessLevel(task_id: number, level: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append('level', level.toString());
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/logging/' + task_id, formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public promoteProcessTask(task_id: number): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/promote/' + task_id, formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public stopServer(): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/stop', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public restartServer(): Observable<CommonResponseInterface> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    return this.http.post<CommonResponseInterface>('/api/process/restart', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  getLoggingIconName(log: LogData) {
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

  getLoggingLevelName(level: number) {
    switch (level) {
      case 0:
        return 'Trace';
      case 10:
        return 'Debug';
      case 20:
        return 'Info';
      case 30:
        return 'Warning';
      case 40:
        return 'Error';
      case 50:
        return 'Critical';
      default:
        return '?';
    }
  }

  getLoggingLevelKey(level: number) {
    switch (level) {
      case 0:
        return 'option.trace';
      case 10:
        return 'option.debug';
      case 20:
        return 'option.info';
      case 30:
        return 'option.warning';
      case 40:
        return 'option.error';
      case 50:
        return 'option.critical';
      default:
        return 'option.unknown';
    }
  }

  getLoggingClass(log: LogData) {
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


