import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MediaDialogChooserComponent } from './media-dialog-chooser/media-dialog-chooser.component';


@Injectable({
  providedIn: 'root'
})
export class MediaDialogChooserService {

  constructor(private dialog: MatDialog) {

  }


  openDialog(skipNodeId: string, maximumRating: number): Observable<string> {
    const dialogRef = this.dialog.open(MediaDialogChooserComponent, {
      width: '350px',
      data: {skipNodeId: skipNodeId, maximumRating: maximumRating}
    });
    return dialogRef.afterClosed();
    
  }
}
