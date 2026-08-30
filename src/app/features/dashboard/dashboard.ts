import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { UserProfile } from '../../models/user.model';

interface StatItem {
  title: string;
  value: string;
  unit: string;
}

interface PastWorkoutItem {
  id: number;
  title: string;
  dateStr: string;
  duration: string;
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

  userName = signal<string>('');

  stats = signal<StatItem[]>([
    { title: 'Текущий вес', value: '—', unit: 'кг' },
    { title: 'Объем за месяц', value: '12 400', unit: 'кг' },
    { title: 'Рекорд недели', value: '140', unit: 'кг' }
  ]);

  pastWorkouts = signal<PastWorkoutItem[]>([
    {
      id: 1,
      title: 'Силовая тренировка А',
      dateStr: 'Вчера, 18:30',
      duration: '1 ч 15 мин',
      exercises: 'Приседания со штангой, Жим лежа, Тяга штанги в наклоне, Подъем на бицепс'
    },
    {
      id: 2,
      title: 'Фулбоди тренировка',
      dateStr: '3 дня назад',
      duration: '1 ч',
      exercises: 'Становая тяга, Отжимания на брусьях, Подтягивания, Планка'
    },
    {
      id: 3,
      title: 'Кардио и пресс',
      dateStr: '5 дней назад',
      duration: '45 мин',
      exercises: 'Беговая дорожка, Скручивания, Подъем ног на турнике, Берпи'
    }
  ]);

  ngOnInit(): void {
    this.loadUserData();
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
}