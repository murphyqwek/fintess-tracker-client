import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { WorkoutService } from '../../core/services/workout.service';
import { UserProfile } from '../../models/user.model';
import { WorkoutDto } from '../../models/workout.model';

interface StatItem {
  title: string;
  value: string;
  unit: string;
}

interface PastWorkoutItem {
  id: string;
  title: string;
  dateStr: string;
  duration?: string;
  exercises: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private workoutService = inject(WorkoutService);

  userName = signal<string>('');

  stats = signal<StatItem[]>([
    { title: 'Текущий вес', value: '—', unit: 'кг' },
    { title: 'Объем за месяц', value: '12 400', unit: 'кг' },
    { title: 'Рекорд недели', value: '140', unit: 'кг' }
  ]);

  pastWorkouts = signal<PastWorkoutItem[]>([]);

  ngOnInit(): void {
    this.loadUserData();
    this.loadRecentWorkouts();
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user: UserProfile) => {
        const displayName = user.name?.trim() ? user.name : user.login;
        this.userName.set(displayName);

        if (user.weight !== null && user.weight !== undefined) {
          this.stats.update((items) =>
            items.map((item) =>
              item.title === 'Текущий вес'
                ? { ...item, value: user.weight!.toString().replace('.', ',') }
                : item
            )
          );
        }
      },
      error: (err) => {
        console.error('Ошибка при загрузке профиля пользователя:', err);
      }
    });
  }

  private loadRecentWorkouts(): void {
    this.workoutService.getWorkouts(3).subscribe({
      next: (response) => {
        const mappedWorkouts: PastWorkoutItem[] = response.workouts.map((w: WorkoutDto) => {
          const uniqueExercises = Array.from(
            new Set(w.workoutSets.map((s) => s.exerciseName))
          ).join(', ');

          return {
            id: w.id,
            title: w.name || 'Тренировка без названия',
            dateStr: this.formatDate(w.createdAt),
            exercises: uniqueExercises || 'Упражнения не добавлены'
          };
        });

        this.pastWorkouts.set(mappedWorkouts);
      },
      error: (err) => {
        console.error('Ошибка при загрузке тренировок:', err);
      }
    });
  }

  private formatDate(dateIso: string): string {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}