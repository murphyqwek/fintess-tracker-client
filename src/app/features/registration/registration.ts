import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class RegistrationComponent {
  registrationForm = new FormGroup({
    login: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  clearError(fieldName: string): void {
    this.registrationForm.get(fieldName)?.markAsUntouched();
  }

  onSubmit() {
    const pass = this.registrationForm.get('password')?.value;
    const confirmPass = this.registrationForm.get('confirmPassword')?.value;

    if (this.registrationForm.invalid || pass !== confirmPass) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    console.log('Успешная регистрация:', this.registrationForm.value);
  }
}