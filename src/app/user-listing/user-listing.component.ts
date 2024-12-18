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

@Component({
  selector: 'app-user-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, YyyyMmDdDatePipe, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './user-listing.component.html',
  styleUrl: './user-listing.component.css'
})
export class UserListingComponent implements OnInit {

  users: UserDefinition[] = [];

  isLoading: boolean = true;

  constructor(private authService: AuthService, private userService: UserService, public featureService: FeatureFlagsService) {

  }

  ngOnInit() {

    this.userService.listUsers().pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.users = data;
    });
  }

  formatLimit(value: number): string {
    switch (value) {
      case 0: return 'G';
      case 40: return 'PG';
      case 60: return 'PG14';
      case 80: return 'R-17';
      case 90: return 'R+';
      case 100: return 'Rx';
      case 200: return 'Unrated';
    }
    return '?';
  }

  fomatBit(value:number, bit: number, onTrue: string, onFalse: string) {    
      return ((value & bit) == bit) ? onTrue : onFalse;
  }

}
