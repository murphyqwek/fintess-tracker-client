import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRegModel } from '../../models/user.reg.model';
import { routes } from '../../app.routes';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class RegistrationComponent {
  authService: AuthService = inject(AuthService);
  private router = inject(Router);

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

    const userReg: UserRegModel = {
      login: this.registrationForm.get('login')?.value || '',
      password: pass || '',
      name: "Jhon Doe",
      birthDate: "2000-01-01"
    };

    this.authService.register(userReg).subscribe({
      next: () => {
        console.log('Успешная регистрация:', userReg);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Ошибка регистрации:', error);
      }
    });
  }
}