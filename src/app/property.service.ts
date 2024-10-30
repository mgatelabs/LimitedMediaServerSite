import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CommonResponseInterface } from './utility';

export interface PropertyDefinition {
  id: string;
  value: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  constructor(private http: HttpClient, private authService: AuthService) {

  }

  listPropertiess(): Observable<PropertyDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, properties: PropertyDefinition[] }>('/api/admin/list/properties', formData, { headers })
      .pipe(
        map(response => {
          // Check if the status is OK
          if (response.status === 'OK') {
            return response.properties;
          } else {
            throw new Error('Invalid status');
          }
        }),
        catchError(this.handleStatusError)
      );
  }

  getPropertyById(property_id: number): Observable<PropertyDefinition> {
    const formData = new FormData();
    formData.append("property_id", property_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, property: PropertyDefinition }>('/api/admin/get/property', formData, { headers })
      .pipe(
        map(response => {
          // Check if the status is OK
          if (response.status === 'OK') {
            return response.property;
          } else {
            throw new Error('Invalid status');
          }
        }),
        catchError(this.handleStatusError)
      );
  }

  updatePropertyById(property_id: string, value: string): Observable<CommonResponseInterface> {
    const formData = new FormData();
    formData.append("property_id", property_id);
    formData.append("value", value);
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<CommonResponseInterface>('/api/admin/update/property', formData, { headers })
      .pipe(
        catchError(this.handleStatusError)
      );
  }

  private handleStatusError(error: any) {
    console.error('An error occurred', error);
    const transformedErrorData = ({ 'status': 'FAIL', 'message': error });
    return throwError(() => transformedErrorData);
  }
}
