export interface MuscleUsage {
  id: number;
  name: string;
  percentageOfUsage: number;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  muscles: MuscleUsage[];
}

export interface ExerciseSearchResponse {
  page: number;
  size: number;
  total: number;
  data: Exercise[];
}