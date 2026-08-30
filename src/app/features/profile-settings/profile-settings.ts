import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { UserProfile } from '../../models/user.model';
import { UserService } from '../../core/services/user.service';

export function notFutureDateValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.html',
})
export class ProfileSettings implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private location = inject(Location);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  user = signal<UserProfile | null>(null);

  profileForm!: FormGroup;

  todayDate = new Date().toISOString().split('T')[0];

  bmi = computed(() => {
    const u = this.user();
    if (!u?.height || !u?.weight || u.height <= 0) return null;
    const heightInMeters = u.height / 100;
    const value = u.weight / (heightInMeters * heightInMeters);
    return value.toFixed(1);
  });

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.maxLength(20)]],
      birthDay: ['', [notFutureDateValidator()]],
      height: [null, [Validators.min(0), Validators.max(300)]],
      weight: [null, [Validators.min(0), Validators.max(1000)]]
    });
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user.set(data);
        this.profileForm.patchValue({
          name: data.name ?? '',
          birthDay: data.birthDay ?? '',
          height: data.height ?? null,
          weight: data.weight ?? null
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Не удалось загрузить данные профиля. Попробуйте позже.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.error.set(null);

    const formValue = this.profileForm.value;
    const payload: Partial<UserProfile> = {};

    if (this.profileForm.get('name')?.dirty) payload.name = formValue.name?.trim() || null;
    if (this.profileForm.get('birthDay')?.dirty) payload.birthDay = formValue.birthDay || null;
    if (this.profileForm.get('height')?.dirty) payload.height = formValue.height !== null ? Number(formValue.height) : null;
    if (this.profileForm.get('weight')?.dirty) payload.weight = formValue.weight !== null ? Number(formValue.weight) : null;

    const bodyToSend = Object.keys(payload).length > 0 ? payload : formValue;

    this.userService.updateCurrentUser(bodyToSend).subscribe({
      next: (updatedUser) => {
        const merged = { ...this.user(), ...updatedUser };
        this.user.set(merged);
        this.profileForm.markAsPristine();
        this.isSaving.set(false);
        this.successMessage.set('Профиль успешно обновлен!');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.error.set('Ошибка при сохранении данных. Проверьте введенные поля.');
        this.isSaving.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  isInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}