import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { fetchAuthSession } from '@aws-amplify/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardAuthService {


  constructor(private router: Router) {
  }
  household: any;
  // Guard for accessing the dashboard route
  canActivate(): boolean {
    const navigation = this.router.getCurrentNavigation();
    const stateFromNavigation = navigation?.extras?.state as { household: any };
    const stateFromHistory = window.history.state;
    this.household = stateFromNavigation?.household || stateFromHistory?.household;
    if (this.household) {
      console.log('Household data received in Dashboard:', this.household);
      return true;
    } else {
      console.error('No household data available');
      this.router.navigate(['/registerHousehold']);
      return false;
    }
    
  }
}
