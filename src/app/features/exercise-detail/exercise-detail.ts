import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { Exercise } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exercise-detail.html',
})
export class ExerciseDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private exerciseService = inject(ExerciseService);
  private location = inject(Location);

  exercise = signal<Exercise | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  primaryMuscle = computed(() => {
    const muscles = this.exercise()?.muscles;
    if (!muscles || muscles.length === 0) return null;
    return [...muscles].sort((a, b) => (b.percentageOfUsage || 0) - (a.percentageOfUsage || 0))[0];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadExercise(id);
    } else {
      this.error.set('Упражнение не найдено');
      this.isLoading.set(false);
    }
  }

  loadExercise(id: string): void {
    this.isLoading.set(true);
    this.exerciseService.getExerciseById(id).subscribe({
      next: (data) => {
        this.exercise.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Не удалось загрузить данные упражнения');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}