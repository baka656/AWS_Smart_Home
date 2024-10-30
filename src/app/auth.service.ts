// auth.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { fetchAuthSession, Hub } from '@aws-amplify/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate {

  constructor(private router: Router) {
  }

  // Guard for accessing the dashboard route
  canActivate(): boolean {
    fetchAuthSession().then((info) => {
      const cognitoIdentityId = info.identityId;
      console.log("Cognito Identity: ",cognitoIdentityId);
      if(cognitoIdentityId == null)
        this.router.navigate(['/login']);
        return false;
      });
    return true;
  }
}
