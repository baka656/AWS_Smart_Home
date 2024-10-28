import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, SidebarHeaderComponent } from '@coreui/angular';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { Amplify } from 'aws-amplify';
import { Router, RouterOutlet } from '@angular/router';
import { Page404Component } from '../page404/page404.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { Hub } from '@aws-amplify/core';
import { DefaultHeaderComponent } from 'src/app/layout';
import { getProperties } from 'aws-amplify/storage';
import { downloadData } from '@aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { RegisterHouseholdComponent } from '../../register-household/register-household.component';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_QZ7LZj8Wm',
      userPoolClientId: 'schkl3khus1l6pid0c06pq5dp',
      identityPoolId: 'us-east-1:979f151c-ebd1-481f-9413-87acc608deeb'
    }
  },
  Storage: {
    S3: {
      bucket: 'home-host-thing-telemetry-1081', 
      region: 'us-east-1', 
    }
  }
});

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [DefaultHeaderComponent, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle, AmplifyAuthenticatorModule, Page404Component, DashboardComponent, RouterOutlet, RegisterHouseholdComponent]
})
export class LoginComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    Hub.listen('auth', (data) => {
      const { payload } = data;
      if (payload.event === 'signedIn') {
        this.currentAuthenticatedUser();
        console.log('waiting for json data');
        this.fetchTelemetryJson();
        this.router.navigate(['/registerHousehold']);
      }
    });
  }

  async currentAuthenticatedUser() {
    try {
      const { username, userId, signInDetails } = await getCurrentUser();
      console.log(`The username: ${username}`);
      console.log(`The userId: ${userId}`);
      console.log(signInDetails?.loginId);
    } catch (err) {
      console.log(err);
    }
  }

  async fetchTelemetryJson() {
    try {
      // Define the path to your JSON file in S3
      const filePath = 'telemetry/1729266229150';

      // Download the JSON file from S3
      const { body, eTag } = await downloadData({
        path: filePath, // S3 object path
        options: {
          onProgress: (event) => {
            console.log(`Downloaded: ${event.transferredBytes} bytes`);
          },
          // Optional: bytesRange can be added here if you want to download a part of the file
          // bytesRange: { start: 0, end: 1024 }
        }
      }).result;

      // Read the body content if available
      if (body) {
        const reader = new FileReader();
        reader.onload = () => {
          const jsonContent = reader.result as string; // Assuming the content is text
          const jsonData = JSON.parse(jsonContent);    // Parse the JSON content
          console.log('Telemetry JSON Data:', jsonData); // Log the parsed JSON data
        };
        reader.readAsText(body as unknown as Blob); // Read the downloaded Blob as text
      } else {
        console.error('No content in the file body');
      }

      // Optional: You can log the eTag to confirm the version of the file downloaded
      console.log('eTag:', eTag);

    } catch (error) {
      console.error('Error fetching telemetry JSON:', error);
    }
  }
  
}
