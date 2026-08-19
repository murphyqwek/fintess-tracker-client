import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserRegModel } from '../../models/user.reg.model';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class RegistrationComponent {
  private isFailedToRegBool = false;
  private validatedFields = new Set<string>();
  private serverErrors: Record<string, string[]> = {};

  private readonly serverErrorTranslations: Record<string, string> = {
    'Login cannot be empty': 'Логин не может быть пустым',
    'Login must be between 6 and 20 characters': 'Логин должен содержать от 6 до 20 символов',
    'Password cannot be empty': 'Пароль не может быть пустым',
    'Password must be between 8 and 20 characters': 'Пароль должен содержать от 8 до 20 символов',
    "User's login is already taken": "Пользователь с таким логином уже существует",
  };

  private authService = inject(AuthService);
  private router = inject(Router);

  registrationForm = new FormGroup({
    login: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { updateOn: 'submit' });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    const isSubmitted = this.validatedFields.has(fieldName);

    if (fieldName === 'confirmPassword' && isSubmitted) {
      const pass = this.registrationForm.get('password')?.value;
      const confirmPass = field?.value;
      if (pass !== confirmPass) {
        return true;
      }
    }

    return !!(field && isSubmitted && field.invalid) || this.getServerErrors(fieldName).length > 0;
  }

  clearError(fieldName: string): void {
    this.registrationForm.get(fieldName)?.markAsUntouched();
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

    const field = this.registrationForm.get(fieldName);

    if (fieldName === 'confirmPassword') {
      const pass = this.registrationForm.get('password')?.value;
      if (field?.hasError('required')) {
        return ['Повторите пароль'];
      }
      if (pass !== field?.value) {
        return ['Пароли не совпадают'];
      }
      return [];
    }

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
    this.isFailedToRegBool = false;
    this.serverErrors = {};
    this.validatedFields = new Set(['login', 'password', 'confirmPassword']);
    this.registrationForm.markAllAsTouched();

    const pass = this.registrationForm.get('password')?.value;
    const confirmPass = this.registrationForm.get('confirmPassword')?.value;

    if (this.registrationForm.invalid || pass !== confirmPass) {
      return;
    }

    const userReg: UserRegModel = {
      login: this.registrationForm.get('login')?.value || '',
      password: pass || '',
    };

    this.authService.register(userReg).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Ошибка регистрации:', error);
        if (error.status === 400 && error.error && typeof error.error === 'object') {
          const errors = error.error.errors || error.error;
          console.log('Server validation errors:', errors);
          this.serverErrors = Object.fromEntries(
            Object.entries(errors).map(([fieldName, messages]) => [
              fieldName,
              (Array.isArray(messages) ? messages : [messages]).map(message =>
                this.serverErrorTranslations[message as string] ?? message
              ),
            ])
          );
          return;
        }

        if (error.status === 400 && error.error && typeof error.error === 'string') {
          const errorMessage = error.error;
          const translatedMessage = this.serverErrorTranslations[errorMessage] ?? errorMessage;
          this.serverErrors = { login: [translatedMessage] };
          return;
        }


        this.isFailedToRegBool = true;
      }
    });
  }

  isFailedToReg() {
    return this.isFailedToRegBool;
  }
}