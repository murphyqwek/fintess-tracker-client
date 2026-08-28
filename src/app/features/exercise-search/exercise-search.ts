import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ExerciseService } from '../../core/services/exercise.service';
import { Exercise, MUSCLE_GROUPS } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exercise-search.html'
})
export class ExerciseSearch implements OnInit {
  private exerciseService = inject(ExerciseService);

  // Константы
  readonly muscleGroups = MUSCLE_GROUPS;
  readonly pageSize = 10;

  // Состояние (Сигналы)
  searchQuery = signal<string>('');
  selectedMuscleIds = signal<number[]>([]); // Теперь можно выбрать несколько
  
  exercises = signal<Exercise[]>([]);
  currentPage = signal<number>(1);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);

  // Вычисляемые значения для пагинации
  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 0);

  // RxJS Subject для задержки ввода поиска
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Подписка на ввод текста с задержкой 400мс
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(1); // Сбрасываем на первую страницу при новом поиске
      this.fetchExercises();
    });

    // Загружаем данные при старте
    this.fetchExercises();
  }

  // Обработчик инпута в HTML
  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  // Клик по чипсу мышцы
  toggleMuscle(muscleId: number) {
    const current = this.selectedMuscleIds();
    if (current.includes(muscleId)) {
      this.selectedMuscleIds.set(current.filter(id => id !== muscleId));
    } else {
      this.selectedMuscleIds.set([...current, muscleId]);
    }
    
    this.currentPage.set(1); // Сбрасываем пагинацию
    this.fetchExercises();
  }

  // Пагинация
  nextPage() {
    if (this.hasNextPage()) {
      this.currentPage.update(p => p + 1);
      this.fetchExercises();
    }
  }

  prevPage() {
    if (this.hasPrevPage()) {
      this.currentPage.update(p => p - 1);
      this.fetchExercises();
    }
  }

  // Основной метод загрузки
  private fetchExercises() {
    this.isLoading.set(true);
    
    this.exerciseService.getExercises(
      this.currentPage(),
      this.pageSize,
      this.searchQuery(),
      this.selectedMuscleIds()
    ).subscribe({
      next: (response) => {
        this.exercises.set(response.data);
        this.totalElements.set(response.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки упражнений', err);
        this.isLoading.set(false);
      }
    });
  }
}