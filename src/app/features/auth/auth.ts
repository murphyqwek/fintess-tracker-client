import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class AuthComponent {
  private isFailedToAuthbool = false;

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
    this.isFailedToAuthbool = !this.isFailedToAuthbool;
  }

  isFailedToAuth() {
    return this.isFailedToAuthbool;
  }
}
