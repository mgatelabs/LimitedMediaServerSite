import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  enabled = true;

  toggle() {
    this.enabled = !this.enabled;
  }
}
