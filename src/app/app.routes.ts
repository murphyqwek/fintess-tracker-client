import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { AuthComponent } from './features/auth/auth';
import { RegistrationComponent } from './features/registration/registration';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        canActivate: [authGuard]
    },

    {
        path: 'register',
        component: RegistrationComponent
    },

    {
        path: 'login',
        component: AuthComponent
    },

    {
        path: '**',
        redirectTo: ''
    }
];
