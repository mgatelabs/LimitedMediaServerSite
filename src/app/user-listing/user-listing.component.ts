import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { AuthService } from '../auth.service';
import { YyyyMmDdDatePipe } from '../yyyy-mm-dd-date.pipe';
import { UserDefinition, UserService } from '../user.service';
import { FeatureFlagsService } from '../feature-flags.service';
import { first } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-user-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, TranslocoDirective, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './user-listing.component.html',
  styleUrl: './user-listing.component.css'
})
export class UserListingComponent implements OnInit {

  users: UserDefinition[] = [];

  isLoading: boolean = true;

  constructor(private authService: AuthService, private userService: UserService, public featureService: FeatureFlagsService, private noticeService: NoticeService) {

  }

  ngOnInit() {

    this.userService.listUsers().pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.users = data;
    });
  }

  formatLimit(value: number): string {
    switch (value) {
      case 0: return this.noticeService.getMessage('form.rating_g');
      case 40: return this.noticeService.getMessage('form.rating_pg');
      case 60: return this.noticeService.getMessage('form.rating_pg13');
      case 80: return this.noticeService.getMessage('form.rating_r17');
      case 90: return this.noticeService.getMessage('form.rating_rplus');
      case 100: return this.noticeService.getMessage('form.rating_rx');
      case 200: return this.noticeService.getMessage('form.rating_unrated');
    }
    return '?';
  }

  fomatBit(value:number, bit: number, onTrue: string, onFalse: string) {    
      return ((value & bit) == bit) ? onTrue : onFalse;
  }

}
