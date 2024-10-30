import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { AuthService } from './auth.service';
import {LoginauthService} from './loginauth.service';
import {DashboardAuthService} from './dashboard-auth.service';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'registerHousehold',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'registerHousehold',
        loadChildren: () => import('./views/register-household/routes').then((m) => m.routes),
        canActivate: [AuthService]
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
        canActivate: [DashboardAuthService]
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'registerHousehold',
    loadComponent: () => import('./views/register-household/register-household.component').then(m => m.RegisterHouseholdComponent),
    data: {
      title: 'Register Household Accounts'
    },
    canActivate: [AuthService]
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    },
    canActivate: [LoginauthService]
  },
  { path: '**', redirectTo: 'login' }
];
