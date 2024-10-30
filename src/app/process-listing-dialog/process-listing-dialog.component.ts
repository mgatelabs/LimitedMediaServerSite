import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProcessService, StatusData } from '../process.service';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ProcessDetailDialogComponent } from '../process-detail-dialog/process-detail-dialog.component';
import { AuthService } from '../auth.service';

/**
 * Dialog version of Process-Listing
 */
@Component({
  selector: 'app-process-listing-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, DecimalPipe, MatIconModule],
  templateUrl: './process-listing-dialog.component.html',
  styleUrl: './process-listing-dialog.component.css'
})
export class ProcessListingDialogComponent {

  statusList: StatusData[] = []

  canManage: boolean = false;

  constructor(
    private authService: AuthService,
    public processDetailDialog: MatDialog,
    public dialogRef: MatDialogRef<ProcessListingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private dataService: ProcessService
  ) {}

  ngOnInit(): void {
    this.refresh(); // Call the method to load data

    this.authService.sessionData$.subscribe(data => {
      this.canManage = this.authService.isFeatureEnabled(this.authService.features.MANAGE_PROCESSES);
    });
  }

  refresh() {
    this.dataService.allProcessStatus()
      .subscribe(data => {
        this.statusList = data;
      });
  }

  cleanOldProcesses() {
    this.dataService.cleanProcessStatus().subscribe(data => {
      this.refresh();
    });
  }

  sweepOldProcesses() {
    this.dataService.sweepProcessStatus().subscribe(data => {
      this.refresh();
    });
  }

  getclasssFor(item: StatusData) {
    if (item.failure) {
      return "status-failure";
    } else if (item.warning) {
       return "status-warning";
    } else if (item.finished) {
      if (item.worked) {
        return "status-worked";
      }
      return "status-finished";
    } else if (item.waiting) {
      return "status-waiting";
    }
    return "status-running";
  }

  getIconFor(item: StatusData) {
    if (item.failure) {
      return "error";
    } else if (item.warning) {
      return "warning";
    }
    if (item.finished) {
      if (item.worked) {
        return "check_finished";
      }    
      return "sailing";
    }    
    if (item.waiting) {
      return "pending";
    }
    return "play_arrow";
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openProcessDetailDialog(task_id: number): void {
    const dialogRef = this.processDetailDialog.open(ProcessDetailDialogComponent, {
      width: window.innerWidth < 768 ? '95%' : '600px', // Adjust width for mobile
      maxWidth: '100vw', // Limit dialog width to viewport size
      data: { task_id: task_id }
    });
  }
}
