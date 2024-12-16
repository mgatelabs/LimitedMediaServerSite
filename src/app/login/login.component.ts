import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { first } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslocoDirective],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

    form: FormGroup;
    form2: FormGroup;

    hasHardSession: boolean = false;

    constructor(private fb: FormBuilder, private _snackBar: MatSnackBar,
        private authService: AuthService,
        private router: Router) {

        this.form = this.fb.group({
            email: [''],
            password: ['']
        });

        this.form2 = this.fb.group({
            pin: ['']
        });

        this.hasHardSession = this.authService.hasHardSession();
    }

    login() {
        const val = this.form.value;

        if (val.email && val.password) {
            this.authService.login(val.email, val.password, '', '')
                .pipe(first())
                .subscribe({
                    next:
                        () => {
                            this.router.navigate(['/a-dash'], { queryParams: { login: true } });
                        }, error: error => {
                            this._snackBar.open(error.message, undefined, { duration: 3000 });
                        }
                }
                );
        }
    }

    hard_session() {
        const val = this.form2.value;
        if (val.pin) {
            this.authService.login('', '', this.authService.HARD_SESSION_TOKEN, val.pin)
                .pipe(first())
                .subscribe({
                    next:
                        () => {
                            this.router.navigate(['/a-dash'], { queryParams: { login: true } });
                        }, error: error => {
                            // Once it fails, it's canceled, so clean it up.
                            this.authService.cleanHardSession();
                            this.hasHardSession = false;
                            this._snackBar.open(error.message, undefined, { duration: 3000 });
                        }
                }
                );
        }
    }

}
