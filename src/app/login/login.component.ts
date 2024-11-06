import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { first } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

    form: FormGroup;

    constructor(private fb: FormBuilder, private _snackBar: MatSnackBar,
        private authService: AuthService,
        private router: Router) {

        this.form = this.fb.group({
            email: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    login() {
        const val = this.form.value;

        if (val.email && val.password) {
            this.authService.login(val.email, val.password)
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

}