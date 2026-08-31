export interface WorkoutSetDto {
  exerciseId: number;
  exerciseName: string;
}

export interface WorkoutDto {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  workoutSets: WorkoutSetDto[];
}

export interface WorkoutListResponse {
  workouts: WorkoutDto[];
  nextCursor: string | null;
}


export interface CreateWorkoutSetDto {
  exerciseId: number;
  repetitions: number;
  weight: number;
  order: number;
}

export interface CreateWorkoutRequest {
  name: string;
  description: string;
  createAt: string;
  workoutSets: CreateWorkoutSetDto[];
}

export interface ResponseWorkoutSetDto {
  exerciseId: number;
  exerciseName: string;
  repetitions: number;
  weight: number;
  order: number;
}

export interface ResponseWorkoutDto {
  id: string;
  name: string;
  description: string;
  date: string;
  workoutSets: ResponseWorkoutSetDto[];
}