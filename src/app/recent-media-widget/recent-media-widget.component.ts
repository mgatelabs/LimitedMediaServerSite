import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { first, Subject } from 'rxjs';
import { FileInfo, HistoryInfo, MediaService } from '../media.service';
import { MediaPlayerTriggerService } from '../media-player-trigger.service';

@Component({
  selector: 'app-recent-media-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, MatPaginatorModule],
  templateUrl: './recent-media-widget.component.html',
  styleUrl: './recent-media-widget.component.css'
})
export class RecentMediaWidgetComponent implements OnInit, OnDestroy {

  histotyData: HistoryInfo[] = [];
  viewData: HistoryInfo[] = [];
  totalItems: number = 0;
  pageIndex: number = 0;

  constructor(private mediaService: MediaService, private router: Router, private triggerMediaPlayer: MediaPlayerTriggerService) {

  }

  setHistoryView(startIndex: number) {
    this.viewData = this.histotyData.slice(startIndex, startIndex + 7);
  };

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.mediaService.listHistory().pipe(first())
      .subscribe({
        next: data => {
          this.histotyData = data;
          this.totalItems = this.histotyData.length;
          this.pageIndex = 0;
          this.setHistoryView(0);
        }, error: error => {
          // Display the error handled by `handleCommonError`
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    //this.pageSize = event.pageSize;
    this.setHistoryView(this.pageIndex * 7);
  }

  itemClicked(item: HistoryInfo) {
    let files: FileInfo[] = [{
      name: item.name,
      id: item.file_id,
      mime_type: item.mime_type,
      preview: item.preview,
      progress: item.progress,
      filesize: 0,
      created: item.timestamp,
      updated: item.timestamp,
      archive: false,
    }]
    this.triggerMediaPlayer.openMediaPlayerComponent({ files: files, start_index: 0 });
  }
}
