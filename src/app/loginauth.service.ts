import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Hub } from '@aws-amplify/core';

@Injectable({
  providedIn: 'root'
})
export class LoginauthService implements CanActivate {

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

  canActivate(): boolean {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']); // Redirect to dashboard if already authenticated
      return false;
    } else {
      return true; // Access allowed to login
    }
  }
}
