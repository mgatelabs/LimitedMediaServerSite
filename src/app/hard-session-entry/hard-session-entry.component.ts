import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { first } from 'rxjs';
import { UserService } from '../user.service';
import { Utility } from '../utility';
import { AuthService } from '../auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { NoticeService } from '../notice.service';

@Component({
  selector: 'app-hard-session-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule, MatCardModule, MatButtonModule, TranslocoDirective],
  templateUrl: './hard-session-entry.component.html',
  styleUrl: './hard-session-entry.component.css'
})
export class HardSessionEntryComponent {
  user_pin: string = '';
  user_pin_2: string = '';

  constructor(private authService: AuthService, private _snackBar: MatSnackBar, private router: Router, private noticeService: NoticeService) {

  }

  establish() {


    if (!Utility.isNotBlank(this.user_pin)) {
      this.noticeService.handleMessage('msgs.missing_parameter', { name: 'pin' });
      return;
    }

    if (!Utility.isNotBlank(this.user_pin_2)) {
      this.noticeService.handleMessage('msgs.missing_parameter', { name: 'pin' });
      return;
    }

    if (this.user_pin !== this.user_pin_2) {
      this.noticeService.handleMessage('msgs.mismatched_parameters', { p1: 'pin', p2: 'pin (again)' });
      return;
    }

    
    this.authService.establishHardSession(this.user_pin, this.user_pin_2)
      .pipe(first())
      .subscribe(
        {
          next: data => {
            if (data) {
              this.router.navigate(['/a-dash'], { queryParams: { login: true } });
            }
          }, error: error => {
            this._snackBar.open(error.message, undefined, { duration: 3000 });
          }
        }
      );
  }
}
