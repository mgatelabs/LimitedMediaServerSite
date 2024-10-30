import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { CommonResponseInterface } from './utility';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) {

  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return [];
  }

  public handleCommonResponseSimple(response: CommonResponseInterface): CommonResponseInterface {
    if (response.status === 'OK') {
      return response;
    }
    throw new Error(response.message || 'Unknown error');
  }

  public handleCommonResponse<T>(response: { status: string, message: string, [key: string]: any }, key: string): T {
    if (response.status === 'OK') {
      return response[key] as T;
    }
    throw new Error(response.message || 'Unknown error');
  }

  public handleCommonResponseMap<T>(response: { status: string, message: string, [key: string]: any }, mapFn: (data: any) => T): T {
    if (response.status === 'OK') {
      return mapFn(response);
    }
    throw new Error(response.message || 'Unknown error');
  }
}
