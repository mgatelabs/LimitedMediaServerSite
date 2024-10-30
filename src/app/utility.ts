import { throwError } from "rxjs";

export interface CommonResponseInterface {
  status: 'OK' | 'FAIL';
  message: string;
}

export interface CommonResponse<T = any> {
  status: 'OK' | 'FAIL';
  message: string;
  [key: string]: any; // Allows extra parameters
}

export class Utility {

  static isNotBlank(input: string): boolean {
    return input.trim().length > 0;
  }

  static handleCommonResponseSimple(response: CommonResponseInterface): CommonResponseInterface {
    if (response.status === 'OK') {
      return response;
    }
    throw new Error(response.message || 'Unknown error');
  }

  static handleCommonResponse<T>(response: { status: string, message: string, [key: string]: any }, key: string): T {
    if (response.status === 'OK') {
      return response[key] as T;
    }
    throw new Error(response.message || 'Unknown error');
  }

  static handleCommonResponseMap<T>(response: { status: string, message: string, [key: string]: any }, mapFn: (data: any) => T): T {
    if (response.status === 'OK') {
      return mapFn(response);
    }
    throw new Error(response.message || 'Unknown error');
  }

  static handleCommonError(error: any) {
    if (error.status !== 200 && error.error) {
      console.log(error);
      // Handle the JSON message from the error
      const errorMessage = error.error.message || 'Unknown error occurred';
      return throwError(() => new Error(errorMessage));
    }
    return throwError(() => new Error('An unexpected error occurred'));
  }

  static getAttrValue(key: string, defaultValue: string = '', itemPrefix: string = ''): string {
    return localStorage.getItem(itemPrefix + '@' + key) || defaultValue;
  }

  static setAttrValue(key: string, value: string, itemPrefix: string = '') {
    localStorage.setItem(itemPrefix + '@' + key, value);
  }


  static removeAttrValue(key: string, itemPrefix: string = '') {
    localStorage.removeItem(itemPrefix + '@' + key);
  }

  static extractUrlValue(input: string): string {
    // Split the input string into lines
    const lines = input.split('\n');

    // Iterate over each line
    for (const line of lines) {
      // Check if the line starts with "url\t" (case sensitive)
      if (line.startsWith('url\t')) {
        // If it does, return the value after the tab
        return line.substring(4); // Assuming "url\t" has 4 characters
      }
    }

    // If no line starts with "url\t" is found, return null
    return '';
  }
}