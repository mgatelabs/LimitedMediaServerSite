import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MediaPlaylist } from './media.service';
import { MediaPlayerComponent } from './media-player/media-player.component';
import { ComponentPortal } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})
export class MediaPlayerTriggerService {

  private overlayRef: OverlayRef | null = null;

  constructor(private overlay: Overlay) {}

  openMediaPlayerComponent(playlist: MediaPlaylist) {
    // Create the overlay if it doesn't exist
    if (!this.overlayRef) {
      const positionStrategy = this.overlay.position()
        .global()
        .centerHorizontally()
        .top('100px');  // You can adjust the positioning here

      this.overlayRef = this.overlay.create({ positionStrategy, hasBackdrop: false, panelClass: 'media-overlay-panel' });
    }

    // Attach the component to the overlay
    const overlayPortal = new ComponentPortal(MediaPlayerComponent);
    const componentRef = this.overlayRef.attach(overlayPortal);

    // Pass data to the overlay component
    componentRef.instance.setData(playlist);

    // Add logic to close the overlay when the close button is clicked
    componentRef.instance.close = () => {
      this.closeOverlay();
    };
  }
  
  closeOverlay() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
  }
}
