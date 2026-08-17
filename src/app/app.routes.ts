import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { AuthComponent } from './features/auth/auth';
import { RegistrationComponent } from './features/registration/registration';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
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
