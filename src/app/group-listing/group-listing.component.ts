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
import { GroupDefinition, UserDefinition, UserService } from '../user.service';
import { FeatureFlagsService } from '../feature-flags.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-group-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, YyyyMmDdDatePipe, MatToolbarModule, MatPaginatorModule, MatGridListModule, LoadingSpinnerComponent],
  templateUrl: './group-listing.component.html',
  styleUrl: './group-listing.component.css'
})
export class GroupListingComponent {
  groups: GroupDefinition[] = [];

  isLoading: boolean = true;

  constructor(private authService: AuthService, private userService: UserService, public featureService: FeatureFlagsService) {

  }

  ngOnInit() {

    this.userService.listGroups().pipe(first()).subscribe(data => {
      this.isLoading = false;
      this.groups = data;
    });
  }
}
