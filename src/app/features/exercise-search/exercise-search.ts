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

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly pageSize = 10;

  searchQuery = signal<string>('');
  selectedMuscleIds = signal<number[]>([]);
  
  exercises = signal<Exercise[]>([]);
  currentPage = signal<number>(1);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);

  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 0);

  isMusclesDropdownOpen = signal<boolean>(false);

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.fetchExercises();
    });

    this.fetchExercises();
  }

  toggleMusclesDropdown(): void {
    this.isMusclesDropdownOpen.update(v => !v);
  }

  closeMusclesDropdown(): void {
    this.isMusclesDropdownOpen.set(false);
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  toggleMuscle(muscleId: number) {
    const current = this.selectedMuscleIds();
    if (current.includes(muscleId)) {
      this.selectedMuscleIds.set(current.filter(id => id !== muscleId));
    } else {
      this.selectedMuscleIds.set([...current, muscleId]);
    }
    
    this.currentPage.set(1);
    this.fetchExercises();
  }

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