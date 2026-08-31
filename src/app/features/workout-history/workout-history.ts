import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutDto } from '../../models/workout.model';

@Component({
  selector: 'app-workout-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './workout-history.html'
})
export class WorkoutHistory implements OnInit {
  private workoutService = inject(WorkoutService);
  private location = inject(Location);

  readonly limit = 6;

  workouts = signal<WorkoutDto[]>([]);
  nextCursor = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  errorMessage = signal<string | null>(null);


  filterDate = signal<string>('');

  ngOnInit(): void {
    this.loadWorkouts();
  }


  loadWorkouts(cursor?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.workoutService.getWorkouts(this.limit, cursor).subscribe({
      next: (response) => {
        this.workouts.set(response.workouts || []);
        this.nextCursor.set(response.nextCursor);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Не удалось загрузить тренировки');
        this.isLoading.set(false);
      }
    });
  }


  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);

    this.workoutService.getWorkouts(this.limit, cursor).subscribe({
      next: (response) => {
        this.workouts.update(current => [...current, ...(response.workouts || [])]);
        this.nextCursor.set(response.nextCursor);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Ошибка при загрузке следующей страницы');
        this.isLoadingMore.set(false);
      }
    });
  }


  onDateChange(value: string): void {
    this.filterDate.set(value);
    if (!value) {
      this.loadWorkouts();
      return;
    }

    const isoCursor = new Date(value).toISOString();
    this.loadWorkouts(isoCursor);
  }


  clearDateFilter(): void {
    this.filterDate.set('');
    this.loadWorkouts();
  }


  getUniqueExercises(workout: WorkoutDto): string {
    if (!workout.workoutSets || workout.workoutSets.length === 0) {
      return 'Без упражнений';
    }
    const uniqueNames = Array.from(
      new Set(workout.workoutSets.map(s => s.exerciseName).filter(Boolean))
    );
    return uniqueNames.join(', ');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.location.back();
  }
}