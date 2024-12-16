import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../user.service';
import { Utility } from '../utility';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule, TranslocoDirective],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {

  user_old_password: string = '';
  user_password: string = '';
  user_password_2: string = '';

  constructor(private userService: UserService, private _snackBar: MatSnackBar) {

  }

  changePassword() {


    if (!Utility.isNotBlank(this.user_old_password)) {
      this._snackBar.open('current password is empty', undefined, {
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

    this.userService.updateMyPassword(this.user_old_password, this.user_password)
      .pipe(first())
      .subscribe(
        {
          next: data => {
            if (data) {
              if (data.message) {
                this._snackBar.open(data.message, undefined, {
                  duration: 2000
                });
              }
              // Reset
              this.user_old_password = '';
              this.user_password = '';
              this.user_password_2 = '';
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }
}
