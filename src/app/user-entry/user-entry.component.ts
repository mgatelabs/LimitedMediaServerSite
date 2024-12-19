import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { first, of, Subject, takeUntil } from 'rxjs';
import { FeatureSelectorComponent } from "../feature-selector/feature-selector.component";
import { GroupDefinition, UserService } from '../user.service';
import { Utility } from '../utility';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-user-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule, FeatureSelectorComponent, TranslocoDirective],
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

  constructor(private userService: UserService, private route: ActivatedRoute, private router: Router, private noticeService: NoticeService) {

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
        this.userService.getUserById(parseInt(entry_uid)).pipe(first()).subscribe({
          next: data => {
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
          }, error: error => {
            // Display the error handled by `handleCommonError`
            //this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
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
      .subscribe({
        next: data => {
          if (data.message) {
            //this._snackBar.open(data.message, undefined, {
            //  duration: 3000
            //});
          }
        }, error: error => {
          // Display the error handled by `handleCommonError`
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  deleteUser() {
    if (confirm(this.noticeService.getMessage('msgs.are_sure_delete_user'))) {
      this.userService.removeUserById(this.user_uid)
        .pipe(first())
        .subscribe({
          next:
            result => {
              this.router.navigate(['/a-users']);
            }, error: error => {
              // Display the error handled by `handleCommonError`
              //this._snackBar.open(error.message, undefined, { duration: 3000 });
            }
        }
        );
    }
  }

  createUser() {

    if (!Utility.isNotBlank(this.user_username)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'username'});
      return;
    }

    if (!Utility.isNotBlank(this.user_password)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'password'});
      return;
    }

    if (!Utility.isNotBlank(this.user_password_2)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'password (Again)'});
      return;
    }

    if (this.user_password != this.user_password_2) {
      this.noticeService.handleMessage('msgs.mismatched_parameters', {"p1": 'password', "p2": 'password (Again)'});
      return;
    }

    this.userService.newUser(this.user_username, this.user_password, this.user_features, this.user_volume_level, this.user_media_level, this.user_gid)
      .pipe(first())
      .subscribe({
        next: data => {
          if (data.message) {
            //this._snackBar.open(data.message, undefined, {
            //  duration: 2000
            //});
          }
          // Reset
          this.is_new = true;
          this.user_username = '';
          this.user_password = '';
          this.user_password_2 = '';
          this.user_features = 0;
          this.user_volume_level = 0;
          this.user_media_level = 0;
        }, error: error => {
          // Display the error handled by `handleCommonError`
          //this._snackBar.open(error.message, undefined, { duration: 3000 });
        }
      });
  }

  featureChanged(value: number) {
    this.user_features = value;
  }
}
