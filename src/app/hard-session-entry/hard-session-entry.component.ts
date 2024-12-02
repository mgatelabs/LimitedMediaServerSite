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

@Component({
  selector: 'app-hard-session-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatToolbarModule, MatIconModule],
  templateUrl: './hard-session-entry.component.html',
  styleUrl: './hard-session-entry.component.css'
})
export class HardSessionEntryComponent {
  user_pin: string = '';
  user_pin_2: string = '';

  constructor(private authService: AuthService, private _snackBar: MatSnackBar, private router: Router) {

  }

  establish() {


    if (!Utility.isNotBlank(this.user_pin)) {
      this._snackBar.open('Pin is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (!Utility.isNotBlank(this.user_pin_2)) {
      this._snackBar.open('Pin (Again) is empty', undefined, {
        duration: 2000
      });
      return;
    }

    if (this.user_pin != this.user_pin_2) {
      this._snackBar.open('pins do not match', undefined, {
        duration: 2000
      });
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
