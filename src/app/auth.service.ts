// auth.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Hub } from '@aws-amplify/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate {
  private isAuthenticated = false; // Track authentication state

  constructor(private router: Router) {
    // Listen for authentication events
    Hub.listen('auth', (data) => {
      const { event } = data.payload;
      if (event === 'signedIn') {
        this.isAuthenticated = true;
        this.router.navigate(['/dashboard']); // Redirect to dashboard on sign-in
      } else if (event === 'signedOut') {
        this.isAuthenticated = false;
        this.router.navigate(['/login']); // Redirect to login on sign-out
      }
    });
  }

  // Guard for accessing the dashboard route
  canActivate(): boolean {
    if (this.isAuthenticated) {
      return true; // Access allowed to dashboard
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return false;
    }
  }

  // Guard for accessing the login route
  canActivateLogin(): boolean {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']); // Redirect to dashboard if already authenticated
      return false;
    } else {
      return true; // Access allowed to login
    }
  }
}
