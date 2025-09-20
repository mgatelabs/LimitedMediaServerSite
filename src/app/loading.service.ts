import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private _isLoading = new BehaviorSubject<boolean>(false);
  private _message = new BehaviorSubject<string>('');

  isLoading$ = this._isLoading.asObservable();
  message$ = this._message.asObservable();

  show(message: string = 'Loading...') {
    this._message.next(message);
    this._isLoading.next(true);
  }

  hide() {
    this._isLoading.next(false);
    this._message.next('');
  }
  
}
