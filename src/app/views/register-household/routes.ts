import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-household.component').then(m => m.RegisterHouseholdComponent),
    data: {
      title: `Households`
    }
  }
];

