import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PubSub } from '@aws-amplify/pubsub';
import { getCurrentUser } from 'aws-amplify/auth';
import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  RowComponent,
  TableDirective,
  TextColorDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { downloadData, uploadData } from '@aws-amplify/storage';
import { CommonModule } from '@angular/common'; 
import { Amplify } from 'aws-amplify';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefaultLayoutComponent } from "../../layout/default-layout/default-layout.component";
import { Router, RouterOutlet } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';

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
import { fetchAuthSession } from 'aws-amplify/auth';
fetchAuthSession().then((info) => {
  const cognitoIdentityId = info.identityId;
  console.log(info);
});
// Apply plugin with configuration
const pubsub = new PubSub({
  region: 'us-east-1',
  endpoint:
    'wss://a286l3f3wjgfx7-ats.iot.us-east-1.amazonaws.com.iot.us-east-1.amazonaws.com/mqtt'
});
@Component({
  selector: 'app-register-household',
  standalone: true,
  imports: [WidgetsDropdownComponent, TextColorDirective, ReactiveFormsModule, CommonModule, CardComponent, CardBodyComponent, RowComponent, ColComponent, ButtonDirective, IconDirective, ReactiveFormsModule, ButtonGroupComponent, FormCheckLabelDirective, ChartjsComponent, NgStyle, CardFooterComponent, GutterDirective, ProgressBarDirective, ProgressComponent, WidgetsBrandComponent, CardHeaderComponent, TableDirective, AvatarComponent, AmplifyAuthenticatorModule, DefaultLayoutComponent, RouterOutlet, DashboardComponent],  
  templateUrl: './register-household.component.html',
  styleUrl: './register-household.component.scss'
})

export class RegisterHouseholdComponent implements OnInit {
  householdForm: FormGroup;
  existingHouseholds: any[] = []; // To store existing households data
  existingHouseholdsjson: any[] = [];
  userEmail: string = ''; // Replace this with actual user email
  loading: boolean = true; // Loader flag
  
  appliancesList = [
    { label: 'Portable Space Heater', value: 'portable_space_heater' },
    { label: 'Wall Air Conditioner', value: 'wall_air_conditioner' },
    { label: 'Oven', value: 'oven' },
    { label: 'Microwave', value: 'microwave' }
  ];

  async currentAuthenticatedUser() {
    try {
      const { username, userId, signInDetails } = await getCurrentUser();
      this.userEmail = signInDetails?.loginId ?? '';
      console.log(this.userEmail);
    } catch (err) {
      console.log(err);
    }
  }

  constructor(private fb: FormBuilder, private modalService: NgbModal, private router: Router) {
    this.householdForm = this.fb.group({
      householdName: ['', Validators.required],
      appliances: this.fb.array([this.createAppliance()]),
      priceBasedLoadSheddingActive: [false],
      loadSheddingSchedule: this.fb.group({
        startTime: [''],
        endTime: ['']
      }),
      circuits: this.fb.array([this.createCircuit()])
    });
    this.householdForm.get('priceBasedLoadSheddingActive')?.valueChanges.subscribe(value => {
      if (value) {
        this.enableLoadSheddingSchedule();
      } else {
        this.disableLoadSheddingSchedule();
      }
    });
  }

  async ngOnInit() {
    try {
      await this.currentAuthenticatedUser();
      await this.loadHouseholdsFromS3();
      this.loading = false;
    } catch (error) {
      console.error('Error loading households from S3:', error);
    }
  }

  // Load existing households from S3 using downloadData
  async loadHouseholdsFromS3() {
    try {
      const filePath = `households/${this.userEmail}.json`;
      const { body } = await downloadData({
        path: filePath
      }).result;

      const reader = new FileReader();
      reader.onload = () => {
        const jsonContent = reader.result as string;
        this.existingHouseholds = JSON.parse(jsonContent) || [];
        this.existingHouseholdsjson = JSON.parse(jsonContent) || [];
        console.log(this.existingHouseholds)
        this.existingHouseholds = Object.values(this.existingHouseholds)
        
        console.log(this.existingHouseholds)
      };
      reader.readAsText(body as unknown as Blob);
    } catch (error) {
      console.error('Error loading household data from S3:', error);
    }
  }

  navigateToDashboard(household: any){
    console.log("In household component", household);
    // Send the message to IoT Core
    //await this.sendMessageToIoTCore(householdName, message);
    this.router.navigate(['/dashboard'], { state: { household } });

  }

  // Create new appliance form group
  createAppliance(): FormGroup {
    return this.fb.group({
      macAddress: ['', [Validators.required, Validators.pattern(/^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/)]],
      appliance: ['', Validators.required]
    });
  }

  // Create new circuit form group
  createCircuit(): FormGroup {
    return this.fb.group({
      ampere: ['', Validators.required],
      circuits: ['', Validators.required],
      threshold: ['', Validators.required]
    });
  }

  // Get appliances form array
  get appliances(): FormArray {
    return this.householdForm.get('appliances') as FormArray;
  }

  // Get circuits form array
  get circuits(): FormArray {
    return this.householdForm.get('circuits') as FormArray;
  }

  // Enable load shedding schedule controls
  enableLoadSheddingSchedule() {
    const loadSheddingSchedule = this.householdForm.get('loadSheddingSchedule') as FormGroup;
    loadSheddingSchedule.get('startTime')?.setValidators([Validators.required]);
    loadSheddingSchedule.get('endTime')?.setValidators([Validators.required]);
    loadSheddingSchedule.get('startTime')?.updateValueAndValidity();
    loadSheddingSchedule.get('endTime')?.updateValueAndValidity();
  }

  // Disable load shedding schedule controls
  disableLoadSheddingSchedule() {
    const loadSheddingSchedule = this.householdForm.get('loadSheddingSchedule') as FormGroup;
    loadSheddingSchedule.get('startTime')?.clearValidators();
    loadSheddingSchedule.get('endTime')?.clearValidators();
    loadSheddingSchedule.get('startTime')?.updateValueAndValidity();
    loadSheddingSchedule.get('endTime')?.updateValueAndValidity();
  }

  // Add a new appliance to the form array
  addAppliance(): void {
    this.appliances.push(this.createAppliance());
  }

  // Remove an appliance from the form array
  removeAppliance(index: number): void {
    this.appliances.removeAt(index);
  }

  // Add a new circuit to the form array
  addCircuit(): void {
    this.circuits.push(this.createCircuit());
  }

  // Remove a circuit from the form array
  removeCircuit(index: number): void {
    this.circuits.removeAt(index);
  }

  // Open the modal for adding a new household
  openAddHouseholdModal(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  // Submit household data and update the S3 JSON file
  async submitHousehold(modal: any) {
    try {
      if (this.householdForm.valid) {
        const formData = this.householdForm.value;

        // Add the new household to the existing list
        this.existingHouseholdsjson.push(formData);

        // Prepare JSON data
        const jsonData = JSON.stringify(this.existingHouseholdsjson);

        // Define the file path in S3
        const filePath = `households/${this.userEmail}.json`;

        // Upload the updated JSON data to S3
        const result = await uploadData({
          path: filePath, // S3 file path
          data: new Blob([jsonData], { type: 'application/json' }), // Upload as a Blob
          options: {
            onProgress: (event) => {
            }
          }
        }).result;

        // Close the modal, reset the form, and reload the household data
        modal.close();
        this.householdForm.reset();
        this.householdForm.setControl('appliances', this.fb.array([this.createAppliance()]));
        this.householdForm.setControl('circuits', this.fb.array([this.createCircuit()]));

        await this.loadHouseholdsFromS3(); // Reload the households to reflect the new data

        console.log('Household data successfully uploaded to S3:', result);
      } else {
        console.log('Form is invalid');
      }
    } catch (error) {
      console.error('Error uploading household data to S3:', error);
    }
  }
}