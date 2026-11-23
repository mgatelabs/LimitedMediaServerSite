import { Injectable } from '@angular/core';
import { HttpClient, HttpUrlEncodingCodec } from '@angular/common/http';
import { Observable, first } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CommonResponse, CommonResponseInterface, Utility } from './utility';
import { NoticeService } from './notice.service';

export interface StatusFile {
  name: string;
  size: number;
}

export interface StatusWrapper {
  tasks: StatusData[];
  workers: WorkerStatus[];
  page: number;
  pages: number;
  total: number;
  weight: number;
}

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
  folder_name?: string;
  folder_img: boolean;
  log: LogData[];
  log_total?: number;
  log_pages?: number;
  log_page?: number;
  log_page_size?: number;
  priority: number;
  weight: number;
  files?: StatusFile[];
}

export interface WorkerStatus {
  index: number;
  name: string;
  status: 'idle' | 'running' | 'dead';
  job: number;
  job_name: string | null;
  job_description: string | null;
  last_seen: number;
  uptime: number;
}

export type LogRowFormat = 'txt' | 'md' | 'json';

export interface LogData {
  s: number,
  time: number;
  text: string;
  fmt: LogRowFormat;
}

export interface ProcessResponse extends CommonResponse {
  task_id?: number;
}

export type LogDownloadFormat = 'md' | 'json';

@Injectable({
  providedIn: 'root'
})
export class ProcessService {

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService) {

  }

  // Process
  public allProcessStatus(clear_history: boolean = false, extra_method: string = 'NONE', page: number = 0, page_size: number = 20): Observable<StatusWrapper> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    if (clear_history) {
      this.noticeService.clearHistory();
    }
    formData.append("page", page.toString());
    formData.append("page_size", page_size.toString());
    return this.http.post<{ status: string, message: string, tasks?: StatusData[], page: number, page_size: number, total: number, weight: number }>('/api/process/status/all/with/' + encodeURIComponent(extra_method), formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponseMap<StatusWrapper>(response, data => ({ tasks: data['tasks'] as StatusData[], workers: data['workers'] as WorkerStatus [], page: data['page'] as number, pages: data['pages'] as number, total: data['total'] as number, weight: data['weight'] as number, files: data['files'] as StatusFile[]}), this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public singleProcessStatus(task_id: number, log_page: number = 0, log_page_size: number = 0, include_files: boolean = false): Observable<StatusData> {
    const formData = new FormData();
    if (log_page_size > 0) {
      formData.append('log_page_size', log_page_size.toString());
      formData.append('log_page', log_page.toString());
    }
    formData.append("include_files", include_files ? "1" : "0");
    const headers = this.authService.getAuthHeader();
    return this.http.post<{ status: string, message: string, task?: StatusData }>('/api/process/status/' + task_id, formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<StatusData>(response, "task", this.noticeService)),
        catchError(Utility.handleCommonError)
      );
  }

  public downloadLog(task_id: number, format: LogDownloadFormat): void {
    const formData = new FormData();
    formData.append('format', format);
    const headers = this.authService.getAuthHeader();
    this.http.post('/api/process/log/download/' + task_id, formData, {
      headers,
      responseType: 'blob',
      observe: 'response'
    }).pipe(first()).subscribe({
      next: response => {
        const disposition = response.headers.get('Content-Disposition') ?? '';
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        const filename = match ? match[1].replace(/['"]/g, '') : `task_${task_id}.${format}`;
        const url = URL.createObjectURL(response.body!);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
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

  public purgeProcessTask(task_id: number): Observable<CommonResponseInterface> {
    const headers = this.authService.getAuthHeader();
    return this.http.delete<CommonResponseInterface>('/api/process/purge/' + task_id, { headers })
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

  formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m ${seconds % 60}s`;
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d === 0) return `${h}h ${m % 60}m`;
    return `${d}d ${h % 24}h ${m % 60}m`;
  }

  getWorkerStatusClass(worker: WorkerStatus): string {    return 'worker-' + worker.status;
  }

  getWorkerStatusIcon(worker: WorkerStatus): string {
    switch (worker.status) {
      case 'running': return 'engineering';
      case 'dead':    return 'sentiment_very_dissatisfied';
      default:        return 'airline_seat_recline_normal';
    }
  }
}


