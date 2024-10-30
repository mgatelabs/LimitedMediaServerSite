import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, first, of, Subject, takeUntil } from 'rxjs';
import { FeatureSelectorComponent } from "../feature-selector/feature-selector.component";
import { ProcessWidgetComponent } from '../process-widget/process-widget.component';
import { GroupDefinition, UserService } from '../user.service';
import { Utility } from '../utility';

@Component({
  selector: 'app-user-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, ProcessWidgetComponent, MatIconModule, FeatureSelectorComponent],
  templateUrl: './user-entry.component.html',
  styleUrl: './user-entry.component.css'
})
export class UserEntryComponent implements OnInit, OnDestroy {

  ready: boolean = false;

  is_new: boolean = false;

  user_username: string = '';
  user_password: string = '';
  user_password_2: string = '';
  user_uid: number = -1;
  user_gid?: number = undefined;
  user_features: number = 0;
  user_volume_level: number = 0;
  user_media_level: number = 0;

  available_groups: GroupDefinition[] = [];

  constructor(private userService: UserService, private _snackBar: MatSnackBar, private route: ActivatedRoute, private router: Router) {

  }

  // Used for Cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {

    this.userService.listGroups().pipe(first()).subscribe(result => {
      this.available_groups = result;
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let entry_uid = params['user_id'] || '';
      if (entry_uid) {
        this.userService.getUserById(parseInt(entry_uid)).pipe(first()).subscribe(data => {
          this.is_new = false;
          this.user_uid = data.id;
          this.user_username = data.username;
          this.user_password = '';
          this.user_password_2 = '';
          this.user_features = data.features;
          this.user_volume_level = data.volume_limit;
          this.user_media_level = data.media_limit;
          this.user_gid = data.group_id;
          this.ready = true;
        });
      } else {
        this.is_new = true;
        this.ready = true;

        this.user_uid = -1;
        this.user_username = '';
        this.user_gid = undefined;
        this.user_password = '';
        this.user_password_2 = '';
        this.user_features = 0;
        this.user_volume_level = 0;
        this.user_media_level = 0;
      }
    }
    );
  }

  updateUser() {

    console.log(this.user_gid);

    this.userService.updateUserLimitsById(this.user_uid, this.user_features, this.user_volume_level, this.user_media_level, this.user_gid)
      .pipe(first())
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to update user';
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (data && data.message) {
          this._snackBar.open(data.message, undefined, {
            duration: 3000
          });
        }
      });
  }

  deleteUser() {
    if (confirm('Are you sure, Delete User?')) {
      this.userService.removeUserById(this.user_uid)
        .pipe(first())
        .pipe(
          catchError(error => {
            // Extract the error message and display it in the snackbar
            const errorMessage = error?.message || 'Failed to delete user';
            this._snackBar.open(errorMessage, undefined, {
              duration: 3000
            });
            return of(null);
          })
        )
        .subscribe(
          result => {
            this.router.navigate(['/a-users']);
          }
        );
    }
  }

  createUser() {

    if (!Utility.isNotBlank(this.user_username)) {
      this._snackBar.open('Username is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (!Utility.isNotBlank(this.user_password)) {
      this._snackBar.open('password is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (!Utility.isNotBlank(this.user_password_2)) {
      this._snackBar.open('password (Again) is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (this.user_password != this.user_password_2) {
      this._snackBar.open('passwords do not match', undefined, {
        duration: 2000
      });
      return;
    }

    this.userService.newUser(this.user_username, this.user_password, this.user_features, this.user_volume_level, this.user_media_level, this.user_gid)
      .pipe(first())
      .pipe(
        catchError(error => {
          // Extract the error message and display it in the snackbar
          const errorMessage = error?.message || 'Failed to delete user';
          this._snackBar.open(errorMessage, undefined, {
            duration: 3000
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          if (data.message) {
            this._snackBar.open(data.message, undefined, {
              duration: 2000
            });
          }
          // Reset
          this.is_new = true;
          this.user_username = '';
          this.user_password = '';
          this.user_password_2 = '';
          this.user_features = 0;
          this.user_volume_level = 0;
          this.user_media_level = 0;
        }
      });
  }

  featureChanged(value: number) {
    this.user_features = value;
  }
}
