import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

import { WorkoutService } from '../../core/services/workout.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { ExerciseReduced } from '../../models/exercise.model';

export interface EditableSet {
  weight: number;
  repetitions: number;
}

export interface EditableExerciseGroup {
  exerciseId: number;
  exerciseName: string;
  muscles?: { id: number; name: string }[];
  sets: EditableSet[];
}

@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-detail.html'
})
export class WorkoutDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private workoutService = inject(WorkoutService);
  private exerciseService = inject(ExerciseService);

  workoutId = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  loadError = signal<string | null>(null);

  workoutName = signal<string>('');
  workoutDate = signal<string>('');
  workoutDescription = signal<string>('');
  exerciseGroups = signal<EditableExerciseGroup[]>([]);

  searchQuery = signal<string>('');
  searchResults = signal<ExerciseReduced[]>([]);
  isSearching = signal<boolean>(false);
  isSearchDropdownOpen = signal<boolean>(false);
  private searchSubject = new Subject<string>();

  totalExercisesCount = computed(() => this.exerciseGroups().length);

  totalSetsCount = computed(() => {
    return this.exerciseGroups().reduce((acc, ex) => acc + ex.sets.length, 0);
  });

  totalVolume = computed(() => {
    return this.exerciseGroups().reduce((acc, ex) => {
      const exVolume = ex.sets.reduce((sAcc, s) => sAcc + ((s.weight || 0) * (s.repetitions || 0)), 0);
      return acc + exVolume;
    }, 0);
  });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isSearching.set(true)),
      switchMap(query => {
        if (!query.trim()) {
          return of({ data: [], page: 0, size: 5, total: 0 });
        }
        return this.exerciseService.getExercises(0, 5, query.trim()).pipe(
          catchError(() => of({ data: [], page: 0, size: 5, total: 0 }))
        );
      })
    ).subscribe(response => {
      this.searchResults.set(response.data);
      this.isSearching.set(false);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workoutId.set(id);
      this.fetchWorkout(id);
    } else {
      this.loadError.set('ID тренировки не передан в URL');
      this.isLoading.set(false);
    }
  }

  fetchWorkout(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.workoutService.getWorkoutById(id).subscribe({
      next: (workout) => {
        this.workoutName.set(workout.name || '');
        this.workoutDescription.set(workout.description || '');
        this.workoutDate.set(this.formatDateForInput(workout.date));

        const groups: EditableExerciseGroup[] = [];
        const sortedSets = [...(workout.workoutSets || [])].sort((a, b) => a.order - b.order);

        for (const set of sortedSets) {
          let group = groups.find(g => g.exerciseId === set.exerciseId);
          if (!group) {
            group = {
              exerciseId: set.exerciseId,
              exerciseName: set.exerciseName,
              sets: []
            };
            groups.push(group);
          }
          group.sets.push({
            weight: set.weight,
            repetitions: set.repetitions
          });
        }

        this.exerciseGroups.set(groups);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set(err?.error?.message || 'Не удалось загрузить данные о тренировке.');
        this.isLoading.set(false);
      }
    });
  }

  private formatDateForInput(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.isSearchDropdownOpen.set(true);
    this.searchSubject.next(value);
  }

  selectExercise(exercise: ExerciseReduced): void {
    this.exerciseGroups.update(groups => [
      ...groups,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscles: exercise.muscles,
        sets: [{ weight: 0, repetitions: 0 }]
      }
    ]);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearchDropdownOpen.set(false);
  }

  removeExercise(index: number): void {
    this.exerciseGroups.update(groups => groups.filter((_, i) => i !== index));
  }

  addSet(exerciseIndex: number): void {
    this.exerciseGroups.update(groups => {
      return groups.map((group, i) => {
        if (i === exerciseIndex) {
          const lastSet = group.sets[group.sets.length - 1];
          const newSet: EditableSet = lastSet 
            ? { weight: lastSet.weight, repetitions: lastSet.repetitions }
            : { weight: 0, repetitions: 0 };
          return { ...group, sets: [...group.sets, newSet] };
        }
        return group;
      });
    });
  }

  removeSet(exerciseIndex: number, setIndex: number): void {
    this.exerciseGroups.update(groups => {
      return groups.map((group, i) => {
        if (i === exerciseIndex) {
          return { ...group, sets: group.sets.filter((_, sIdx) => sIdx !== setIndex) };
        }
        return group;
      });
    });
  }

  goBack(): void {
    this.location.back();
  }
}