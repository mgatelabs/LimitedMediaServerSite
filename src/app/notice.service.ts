import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonResponse, CommonResponseInterface } from './utility';
import { TranslocoService } from '@jsverse/transloco';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NoticeService {

  private queue: string[] = [];
  private isProcessing = false;

  constructor(private _snackBar: MatSnackBar, private translocoService: TranslocoService) {

  }

  getMessage(key: string, values: {} = {}): string {
    return this.translocoService.translate(key, values);
  }

  getMessageWithDefault(key: string, values: {} = {}, fallback: string): string {
    let v = this.translocoService.translate(key, values);
    return v === key ? fallback : v;
  }

  handleMessage(key: string, values: {} = {}) {
    this.showMessage(this.getMessage(key, values));
  }

  handleError(error: HttpErrorResponse) {
    if (error && error.error && (error.error.messages || error.error.message)) {
      this.handleResponse(error.error as CommonResponseInterface);
    }
  }

  handleResponse(payload: CommonResponseInterface | CommonResponse, clear_history: boolean = false) {
    if (payload.messages) {
      for (let message of payload.messages) {
        let m = this.translocoService.translate(message[0], message[1] as {});
        this.showMessage(m, clear_history);
      }
    } else if (payload.message) {
      this.showMessage(payload.message, clear_history);
    }
  }

  private showMessage(message: string, clear_history: boolean = false) {
    if (clear_history && this.queue.length > 0) {
      this.queue.length = 0;
    }
    this.queue.push(message);
    this.processQueue();
  }

  private processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const message = this.queue.shift();

    const snackBarRef = this._snackBar.open(message || '', this.translocoService.translate('action.dismiss'), { duration: 3000 });

    snackBarRef.afterDismissed().subscribe(() => {
      this.isProcessing = false;
      this.processQueue();
    });
  }

  public clearHistory() {
    this.queue.length = 0;
  }
}
