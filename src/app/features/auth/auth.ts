import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserAuthModel } from '../../models/user.auth.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class AuthComponent {
  private isFailedToAuthbool = false;
  private validatedFields = new Set<string>();
  private serverErrors: Record<string, string[]> = {};

  private readonly serverErrorTranslations: Record<string, string> = {
    'Login cannot be empty': 'Логин не может быть пустым',
    'Login must be between 6 and 20 characters': 'Логин должен содержать от 6 до 20 символов',
    'Password cannot be empty': 'Пароль не может быть пустым',
    'Password must be between 8 and 20 characters': 'Пароль должен содержать от 8 до 20 символов',
  };

  private authService = inject(AuthService);
  private router = inject(Router);

  authForm = new FormGroup({
    login: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
  }, { updateOn: 'submit' });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && this.validatedFields.has(fieldName) && field.invalid) || this.getServerErrors(fieldName).length > 0;
  }

  clearError(fieldName: string): void {
    this.authForm.get(fieldName)?.markAsUntouched();
    this.validatedFields.delete(fieldName);

    const serverFieldName = Object.keys(this.serverErrors)
      .find(key => key.toLowerCase() === fieldName.toLowerCase());
    if (serverFieldName) {
      delete this.serverErrors[serverFieldName];
    }
  }

  getServerErrors(fieldName: string): string[] {
    const serverFieldName = Object.keys(this.serverErrors)
      .find(key => key.toLowerCase() === fieldName.toLowerCase());

    return serverFieldName ? this.serverErrors[serverFieldName] : [];
  }

  getFieldErrors(fieldName: string): string[] {
    const serverErrors = this.getServerErrors(fieldName);
    if (serverErrors.length > 0) {
      return [serverErrors[0]];
    }

    const field = this.authForm.get(fieldName);
    if (field?.hasError('required')) {
      return [fieldName === 'login' ? 'Логин не может быть пустым' : 'Пароль не может быть пустым'];
    }
    if (field?.hasError('minlength') || field?.hasError('maxlength')) {
      return [fieldName === 'login'
        ? 'Логин должен содержать от 6 до 20 символов'
        : 'Пароль должен содержать от 8 до 20 символов'];
    }

    return [];
  }

  onSubmit() {
    this.isFailedToAuthbool = false;
    this.serverErrors = {};
    this.validatedFields = new Set(['login', 'password']);
    this.authForm.markAllAsTouched();

    if (this.authForm.invalid) {
      return;
    }

    const pass = this.authForm.get('password')?.value;

    const userAuth: UserAuthModel = {
        login: this.authForm.get('login')?.value || '',
        password: pass || ''
    };
  
    this.authService.login(userAuth).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Ошибка авторизации:', error);
        if (error.status === 400 && error.error && typeof error.error === 'object') {
          this.serverErrors = Object.fromEntries(
            Object.entries(error.error.errors).map(([fieldName, messages]) => [
              fieldName,
              (Array.isArray(messages) ? messages : [messages]).map(message =>
                this.serverErrorTranslations[message] ?? message
              ),
            ])
          );
          return;
        }

        this.isFailedToAuthbool = true;
      }
    });
  }

  isFailedToAuth() {
    return this.isFailedToAuthbool;
  }
}
