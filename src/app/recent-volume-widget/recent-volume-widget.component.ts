import { Component, OnDestroy, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { HistoryData, VolumeService } from '../volume.service';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { first, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-recent-volume-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, MatPaginatorModule],
  templateUrl: './recent-volume-widget.component.html',
  styleUrl: './recent-volume-widget.component.css'
})
export class RecentWidgetComponent implements OnInit, OnDestroy {

  histotyData: HistoryData[] = [];

  viewData: HistoryData[] = [];

  totalItems: number = 0;
  pageIndex: number = 0;

  constructor(private volumeService: VolumeService, private router: Router) {
    
  }

  setHistoryView (startIndex: number) {
    this.viewData = this.histotyData.slice(startIndex, startIndex + 7);
  };
  
  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.volumeService.fetchHistory().pipe(first()).subscribe({next: data => {
      this.histotyData = data;
      this.totalItems = this.histotyData.length;
      this.pageIndex = 0;
      this.setHistoryView(0);
    }, error: error => {
      // Display the error handled by `handleCommonError`
      //this._snackBar.open(error.message, undefined, { duration: 3000 });
    }});
  }

  onPageChange(event: any) {
    // Handle page change event
    this.pageIndex = event.pageIndex;
    //this.pageSize = event.pageSize;
    this.setHistoryView(this.pageIndex * 7);
  }
}
