import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { HardSessionItem, UserService } from '../user.service';
import { FeatureFlagsService } from '../feature-flags.service';
import { first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-hard-session-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent, TranslocoDirective],
  templateUrl: './hard-session-listing.component.html',
  styleUrl: './hard-session-listing.component.css'
})
export class HardSessionListingComponent implements OnInit {

  sessions: HardSessionItem[] = [];

  isLoading: boolean = true;

  constructor(private userService: UserService, public featureService: FeatureFlagsService, private route: ActivatedRoute, private noticeService: NoticeService) {

  }

  private is_mine: boolean = true;

  ngOnInit() {
    const url = this.route.snapshot.url.map(segment => segment.path).join('/');
    this.is_mine = url.includes('mine');

    this.userService.listHardSessions(this.is_mine).pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.sessions = data;
    });
  }

  removeSession(item: HardSessionItem) {
    // Find the index of the session to remove
    const index = this.sessions.findIndex(session => session.id === item.id);
    if (index !== -1) {
      this.userService.removeHardSession(item.id, this.is_mine).pipe(first()).subscribe({
        next: data => {
          // Remove the session at the found index
          this.sessions.splice(index, 1);
        }, error: error => {
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
    }
  }
}
