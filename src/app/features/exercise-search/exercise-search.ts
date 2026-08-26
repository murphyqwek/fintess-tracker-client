import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-search',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './exercise-search.html'
})
export class ExerciseSearch {
  searchQuery = signal<string>('');
  selectedMuscle = signal<string | null>(null);

  // Список всех уникальных мышц для фильтра
  muscleChips = signal<string[]>([
    'Грудь', 'Спина', 'Квадрицепс', 'Бицепс бедра', 'Бицепс', 'Трицепс', 'Плечи', 'Пресс'
  ]);

  // Моковые данные по твоей структуре бэкенда
  exercises = signal<Exercise[]>([
    {
      id: 1,
      name: 'Жим штанги лежа',
      description: 'Базовое многосуставное упражнение для развития грудных мышц, трицепсов и передних дельт.',
      muscles: [
        { id: 101, name: 'Грудь', percentageOfUsage: 70 },
        { id: 102, name: 'Трицепс', percentageOfUsage: 20 },
        { id: 103, name: 'Плечи', percentageOfUsage: 10 }
      ]
    },
    {
      id: 2,
      name: 'Приседания со штангой',
      description: 'Одно из базовых упражнений силового тренинга для мышц ног и кора.',
      muscles: [
        { id: 104, name: 'Квадрицепс', percentageOfUsage: 60 },
        { id: 105, name: 'Бицепс бедра', percentageOfUsage: 25 },
        { id: 106, name: 'Пресс', percentageOfUsage: 15 }
      ]
    }
  ]);

  // Реактивная фильтрация по названию и выбранной мышце
  filteredExercises = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const muscle = this.selectedMuscle();

    return this.exercises().filter(ex => {
      const matchesName = ex.name.toLowerCase().includes(query);
      const matchesMuscle = muscle 
        ? ex.muscles.some(m => m.name.toLowerCase() === muscle.toLowerCase())
        : true;

      return matchesName && matchesMuscle;
    });
  });

  toggleMuscle(muscleName: string) {
    this.selectedMuscle.update(current => current === muscleName ? null : muscleName);
  }
}