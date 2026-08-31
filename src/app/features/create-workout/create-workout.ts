import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ExerciseReduced } from '../../models/exercise.model';
import { CreateWorkoutRequest, CreateWorkoutSetDto } from '../../models/workout.model';
import { ExerciseService } from '../../core/services/exercise.service';
import { WorkoutService } from '../../core/services/workout.service';
import { generateUUID } from '../../core/utils/uuid.util';

export interface WorkoutSetFormItem {
  weight: number | null;
  repetitions: number | null;
}

export interface WorkoutExerciseFormItem {
  exercise: ExerciseReduced;
  sets: WorkoutSetFormItem[];
}

@Component({
  selector: 'app-create-workout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-workout.html'
})
export class CreateWorkout {
  private readonly exerciseService = inject(ExerciseService);
  private readonly workoutService = inject(WorkoutService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  workoutName = signal<string>('');
  workoutDescription = signal<string>('');
  workoutDate = signal<string>(this.getDefaultDateTime());

  selectedExercises = signal<WorkoutExerciseFormItem[]>([]);

  searchQuery = signal<string>('');
  searchResults = signal<ExerciseReduced[]>([]);
  isSearching = signal<boolean>(false);
  isSearchDropdownOpen = signal<boolean>(false);
  private readonly searchSubject = new Subject<string>();

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isConflictError = signal<boolean>(false);
  idempotencyKey = signal<string>(generateUUID());

  createdWorkoutId = signal<string | number | null>(null);
  showSuccessModal = signal<boolean>(false);

  totalExercisesCount = computed(() => this.selectedExercises().length);
  
  totalSetsCount = computed(() => 
    this.selectedExercises().reduce((acc, curr) => acc + curr.sets.length, 0)
  );

  totalVolume = computed(() => {
    return this.selectedExercises().reduce((total, item) => {
      return total + item.sets.reduce((setTotal, s) => {
        const w = s.weight ?? 0;
        const r = s.repetitions ?? 0;
        return setTotal + (w * r);
      }, 0);
    }, 0);
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isSearching.set(true)),
      switchMap((query) => {
        const trimmed = query.trim();
        if (!trimmed) {
          this.isSearching.set(false);
          return of({ page: 1, size: 5, total: 0, data: [] });
        }
        return this.exerciseService.getExercises(1, 5, trimmed);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.searchResults.set(res?.data || []);
        this.isSearching.set(false);
        this.isSearchDropdownOpen.set(true);
      },
      error: () => {
        this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });
  }

  onSearchInput(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  selectExercise(exercise: ExerciseReduced) {
    this.selectedExercises.update((current) => [
      ...current,
      {
        exercise,
        sets: [{ weight: null, repetitions: null }]
      }
    ]);

    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearchDropdownOpen.set(false);
  }

  removeExercise(index: number) {
    this.selectedExercises.update((current) => current.filter((_, i) => i !== index));
  }

  addSet(exerciseIndex: number) {
    this.selectedExercises.update((exercises) => {
      const copy = [...exercises];
      copy[exerciseIndex] = {
        ...copy[exerciseIndex],
        sets: [...copy[exerciseIndex].sets, { weight: null, repetitions: null }]
      };
      return copy;
    });
  }

  removeSet(exerciseIndex: number, setIndex: number) {
    this.selectedExercises.update((exercises) => {
      const copy = [...exercises];
      if (copy[exerciseIndex].sets.length > 1) {
        copy[exerciseIndex] = {
          ...copy[exerciseIndex],
          sets: copy[exerciseIndex].sets.filter((_, i) => i !== setIndex)
        };
      }
      return copy;
    });
  }

  validate(): string | null {
    if (!this.workoutName().trim()) {
      return 'Пожалуйста, введите название тренировки.';
    }

    if (this.selectedExercises().length === 0) {
      return 'Добавьте хотя бы одно упражнение в тренировку.';
    }

    for (const item of this.selectedExercises()) {
      if (item.sets.length === 0) {
        return `Упражнение "${item.exercise.name}" должно содержать минимум 1 подход.`;
      }
      for (let s = 0; s < item.sets.length; s++) {
        const set = item.sets[s];
        if (set.repetitions === null || set.repetitions <= 0) {
          return `Укажите количество повторений (минимум 1) для "${item.exercise.name}", подход ${s + 1}.`;
        }
        if (set.weight === null || set.weight < 0) {
          return `Укажите вес (>= 0) для "${item.exercise.name}", подход ${s + 1}.`;
        }
      }
    }

    return null;
  }

  saveWorkout() {
    this.errorMessage.set(null);
    this.isConflictError.set(false);

    const validationError = this.validate();
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.isSubmitting.set(true);

    let currentOrder = 0;
    const workoutSets: CreateWorkoutSetDto[] = [];

    for (const item of this.selectedExercises()) {
      for (const s of item.sets) {
        workoutSets.push({
          exerciseId: item.exercise.id,
          repetitions: Number(s.repetitions),
          weight: Number(s.weight),
          order: currentOrder++
        });
      }
    }

    const payload: CreateWorkoutRequest = {
      name: this.workoutName().trim(),
      description: this.workoutDescription().trim(),
      createAt: new Date(this.workoutDate()).toISOString(),
      workoutSets
    };

    this.workoutService.createWorkout(payload, this.idempotencyKey()).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        
        let id: string | number | null = null;
        if (typeof response === 'object' && response !== null && 'id' in response) {
          id = (response as { id: string | number }).id;
        } else if (typeof response === 'string' || typeof response === 'number') {
          id = response;
        }

        this.createdWorkoutId.set(id);
        this.showSuccessModal.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 409) {
          this.isConflictError.set(true);
          this.errorMessage.set('Ошибка 409 (Conflict): тренировка с таким Idempotency-Key или параметрами уже существует.');
        } else {
          this.errorMessage.set(err.error?.message || 'Не удалось сохранить тренировку. Попробуйте еще раз.');
        }
      }
    });
  }

  resetForm() {
    this.workoutName.set('');
    this.workoutDescription.set('');
    this.workoutDate.set(this.getDefaultDateTime());
    this.selectedExercises.set([]);
    this.searchQuery.set('');
    this.errorMessage.set(null);
    this.isConflictError.set(false);
    this.showSuccessModal.set(false);
    this.createdWorkoutId.set(null);
    this.idempotencyKey.set(generateUUID());
  }

  goToCreatedWorkout() {
    this.router.navigate(['/workout', this.createdWorkoutId()]);
  }

  goToDashboard() {
    this.router.navigate(['/']);
  }

  goBack() {
    window.history.back();
  }

  private getDefaultDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}