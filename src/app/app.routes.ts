import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { AuthComponent } from './features/auth/auth';
import { RegistrationComponent } from './features/registration/registration';
import { authGuard } from './core/guards/auth.guard';
import { regLoginGuard } from './core/guards/reg.login.guard';
import { DashboardComponent } from './features/dashboard/dashboard';

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
        path: '**',
        redirectTo: ''
    }
];
