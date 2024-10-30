import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { fetchAuthSession, Hub } from '@aws-amplify/core';

@Injectable({
  providedIn: 'root'
})
export class LoginauthService implements CanActivate {

  constructor(private router: Router) {
    // Listen for authentication events
  }

  // Guard for accessing the dashboard route
  canActivate(): boolean {
    fetchAuthSession().then((info) => {
      const cognitoIdentityId = info.identityId;
      console.log("Cognito Identity: ",cognitoIdentityId);
      if(cognitoIdentityId != null)
        this.router.navigate(['/registerHousehold']);
        return false;
      });
    return true;
  }
}
