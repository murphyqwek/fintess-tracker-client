import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { AuthComponent } from './features/auth/auth';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },

    {
        path: 'register',
        component: AuthComponent
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
