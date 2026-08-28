// models/exercise.model.ts
export interface Muscle {
  id: number;
  name: string;
  percentageOfUsage?: number;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  muscles: Muscle[];
}

export interface PageResponse<T> {
  page: number;
  size: number;
  total: number;
  data: T[];
}

// Хардкодим мышцы с твоего скриншота БД
export const MUSCLE_GROUPS: Muscle[] = [
  { id: 1, name: 'Грудные мышцы' },
  { id: 2, name: 'Передние дельты' },
  { id: 3, name: 'Средние дельты' },
  { id: 4, name: 'Задние дельты' },
  { id: 5, name: 'Трицепс' },
  { id: 6, name: 'Бицепс' },
  { id: 7, name: 'Предплечья' },
  { id: 8, name: 'Широчайшие мышцы спины' },
  { id: 9, name: 'Трапециевидные мышцы' },
  { id: 10, name: 'Разгибатели спины' },
  { id: 11, name: 'Квадрицепс' },
  { id: 12, name: 'Бицепс бедра' },
  { id: 13, name: 'Ягодичные мышцы' },
  { id: 14, name: 'Икроножные мышцы' },
  { id: 15, name: 'Пресс' }
];