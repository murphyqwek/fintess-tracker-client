import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth';
import { RegistrationComponent } from './features/registration/registration';
import { authGuard } from './core/guards/auth.guard';
import { regLoginGuard } from './core/guards/reg.login.guard';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ExerciseSearch } from './features/exercise-search/exercise-search';
import { ExerciseDetail } from './features/exercise-detail/exercise-detail';
import { ProfileSettings } from './features/profile-settings/profile-settings';
import { CreateWorkout } from './features/create-workout/create-workout';

export const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [authGuard]
    },

    {
        path: 'register',
        component: RegistrationComponent,
        canActivate: [regLoginGuard]
    },

    {
        path: 'login',
        component: AuthComponent,
        canActivate: [regLoginGuard]
    },

    {
        path: 'exercise-search',
        component: ExerciseSearch,
        canActivate: [authGuard]
    },

    { 
        path: 'exercise/:id', 
        component: ExerciseDetail, 
        canActivate: [authGuard]
    },

    {
        path: 'me',
        component: ProfileSettings,
        canActivate: [authGuard]
    },

    {
        path: 'workout/create',
        component: CreateWorkout,
        canActivate: [authGuard]
    },

    {
        path: '**',
        redirectTo: ''
    }
];
