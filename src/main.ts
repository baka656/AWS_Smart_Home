
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';

import { Amplify } from 'aws-amplify';
// import amplifyconfig from './amplifyconfiguration.json';

// Amplify.configure(amplifyconfig);

import { appConfig } from './app/app.config';
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));