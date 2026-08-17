import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserAuthModel } from '../../models/user.auth.model';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class AuthComponent {
  private isFailedToAuthbool = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  authForm = new FormGroup({
    login: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  clearError(fieldName: string): void {
    this.authForm.get(fieldName)?.markAsUntouched();
  }

  onSubmit() {
    const pass = this.authForm.get('password')?.value;

    console.log('Успешная авторизация:', this.authForm.value);

    const userAuth: UserAuthModel = {
        login: this.authForm.get('login')?.value || '',
        password: pass || ''
    };
  
    this.authService.login(userAuth).subscribe({
      next: () => {
        console.log('Успешная авторизация:', userAuth);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Ошибка авторизации:', error);
        this.isFailedToAuthbool = true;
      }
    });
  }

  isFailedToAuth() {
    return this.isFailedToAuthbool;
  }
}
