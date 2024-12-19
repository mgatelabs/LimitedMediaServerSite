import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../user.service';
import { Utility } from '../utility';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

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

  constructor(private userService: UserService, private noticeService: NoticeService) {

  }

  changePassword() {


    if (!Utility.isNotBlank(this.user_old_password)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'current password'});
      return;
    }


    if (!Utility.isNotBlank(this.user_password)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'password'});
      return;
    }

    if (!Utility.isNotBlank(this.user_password_2)) {
      this.noticeService.handleMessage('msgs.missing_parameter', {"name": 'password (again)'});
      return;
    }

    if (this.user_password != this.user_password_2) {
      this.noticeService.handleMessage('msgs.mismatched_parameters', {"p1": 'password', "p2": 'password (Again)'});
      return;
    }

    this.userService.updateMyPassword(this.user_old_password, this.user_password)
      .pipe(first())
      .subscribe(
        {
          next: data => {
            if (data) {
              if (data.message) {
                //this._snackBar.open(data.message, undefined, {
                //  duration: 2000
                //});
              }
              // Reset
              this.user_old_password = '';
              this.user_password = '';
              this.user_password_2 = '';
            }
          }, error: error => {
            //this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }
}
