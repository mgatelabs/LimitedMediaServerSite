import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CommonResponseInterface, Utility } from './utility';
import { NoticeService } from './notice.service';

export interface PropertyDefinition {
  id: string;
  value: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService) {

  }

  listPropertiess(): Observable<PropertyDefinition[]> {
    const formData = new FormData();
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, properties: PropertyDefinition[] }>('/api/admin/list/properties', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<PropertyDefinition[]>(response, 'properties', this.noticeService))
      );
  }

  getPropertyById(property_id: number): Observable<PropertyDefinition> {
    const formData = new FormData();
    formData.append("property_id", property_id.toString());
    const headers = this.authService.getAuthHeader();
    // Adjust the API endpoint and payload as per your requirements
    return this.http.post<{ status: string, message: string, property: PropertyDefinition }>('/api/admin/get/property', formData, { headers })
      .pipe(
        map(response => Utility.handleCommonResponse<PropertyDefinition>(response, 'property', this.noticeService))
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
        map(response => Utility.handleCommonResponseSimple(response, this.noticeService))
      );
  }

  private handleStatusError(error: any) {
    console.error('An error occurred', error);
    const transformedErrorData = ({ 'status': 'FAIL', 'message': error });
    return throwError(() => transformedErrorData);
  }
}
