import { CommonModule, DOCUMENT, NgStyle } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, Renderer2, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import { CONNECTION_STATE_CHANGE, ConnectionState } from '@aws-amplify/pubsub';
import { Hub } from 'aws-amplify/utils';
import { downloadData } from '@aws-amplify/storage';
import { list } from 'aws-amplify/storage';
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
  ModalService,
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
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PubSub } from '@aws-amplify/pubsub';
import { WidgetStatAComponent } from '@coreui/angular'; 
import { fetchAuthSession } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';


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

const pubsub = new PubSub({
  region: 'us-east-1',
  endpoint: 'wss://a286l3f3wjgfx7-ats.iot.us-east-1.amazonaws.com/mqtt'
});

interface TelemetryData {
  start_time: number;
  end_time: number;
  appliance_id: string;
  energy_usage: number;
}

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [WidgetsDropdownComponent, MatSnackBarModule ,TextColorDirective,CommonModule, WidgetStatAComponent ,CardComponent, CardBodyComponent, RowComponent, ColComponent, ButtonDirective, IconDirective, ReactiveFormsModule, ButtonGroupComponent, FormCheckLabelDirective, ChartjsComponent, NgStyle, CardFooterComponent, GutterDirective, ProgressBarDirective, ProgressComponent, WidgetsBrandComponent, CardHeaderComponent, TableDirective, AvatarComponent, AmplifyAuthenticatorModule, RouterOutlet]
})

export class DashboardComponent implements OnInit {
  applianceForm: FormGroup;
  timestamp: string | null = null;
  selectedAppliance: any;
  userEmail: string = '';
  private lambdaUrl = 'http://i6nctil6ftdmpwctaurp5axpia0dcxkc.lambda-url.us-east-1.on.aws/';
  prices = [0.0309, 0.0612, 0.0925, 0.1244, 0.1667, 0.2148, 0.3563, 0.4893, 0.7098, 0.7882, 
    0.5586, 0.3326, 0.2152, 0.1487, 0.0864, 0.0587, 0.0385, 0.0246, 0.0165, 0.0215, 
    0.0359, 0.0206, 0.0106, 0.0192];
  telemetryData: TelemetryData[] = [];
  household: any;
  applianceData: { [appliance_id: string]: { timestamps: number[]; powerUsages: number[] } } = {};
  minutePrices: number[] = []; // Prices for each minute of the day
  selectedPeriod: 'Hour' = 'Hour';
  chartData: any;

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #document: Document = inject(DOCUMENT);
  readonly #renderer: Renderer2 = inject(Renderer2);
  readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);
  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  #mainChartRefEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });
  public chart: Array<IChartProps> = [];
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Hour')
  });

  constructor(private snackBar: MatSnackBar, private http: HttpClient , private router: Router, private modalService: NgbModal, private fb: FormBuilder) {
    this.applianceForm = this.fb.group({
      priority: ['low'],
      powerLevel: ['off'],
      turnOnTime: [''],
      turnOnTimeLevel: ['level_1'],
      duration: [''],
    });
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const stateFromNavigation = navigation?.extras?.state as { household: any };
    const stateFromHistory = window.history.state;
    this.household = stateFromNavigation?.household || stateFromHistory?.household;
    this.currentAuthenticatedUser();
    if (this.household) {
      console.log('Household data received in Dashboard:', this.household);
    } else {
      console.error('No household data available');
    }
    fetchAuthSession().then((info) => {
      const cognitoIdentityId = info.identityId;
      console.log("Cognito Identity: ",cognitoIdentityId);
      });
    pubsub.subscribe({topics: '#'}).subscribe({
      next: (data) => console.log('Message received', data),
      error: (error) => console.error(error),
      complete: () => console.log('Done')
    });
    this.initializeMinutePrices();
    // After fetching telemetry data
    this.fetchTelemetryData().then(() => {
      this.processTelemetryData();
      this.prepareChartData();
    });
    //this.fetchTelemetryData();
    // const xdd = this.fetchCustomPricingData();
    // console.log("Lambda Data: ", xdd);
    console.log("Telemetry Data: ", this.telemetryData);
    this.initCharts();
    this.updateChartOnColorModeChange();
    
  }

  initCharts(): void {
    this.mainChart = this.#chartsData.mainChart;
  }

  // setTrafficPeriod(value: string): void {
  //   this.trafficRadioGroup.setValue({ trafficRadio: value });
  //   this.#chartsData.initMainChart(value);
  //   this.initCharts();
  // }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  updateChartOnColorModeChange() {
    const unListen = this.#renderer.listen(this.#document.documentElement, 'ColorSchemeChange', () => {
      this.setChartStyles();
    });

    this.#destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.#chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }

  initializeMinutePrices() {
    this.minutePrices = [];
    for (let hour = 0; hour < 24; hour++) {
      const price = this.prices[hour];
      for (let minute = 0; minute < 60; minute++) {
        this.minutePrices.push(price);
      }
    }
  }

  processTelemetryData() {
    this.applianceData = {};

    for (const telemetry of this.telemetryData) {
      const { start_time, end_time, appliance_id, energy_usage } = telemetry;

      if (!this.applianceData[appliance_id]) {
        this.applianceData[appliance_id] = { timestamps: [], powerUsages: [] };
      }

      const durationMinutes = Math.floor((end_time - start_time) / 60);
      if (durationMinutes <= 0) continue;

      const powerUsagePerMinute = energy_usage / durationMinutes; // kWh per minute

      for (let i = 0; i < durationMinutes; i++) {
        const timestamp = start_time + i * 60; // Next minute in seconds
        this.applianceData[appliance_id].timestamps.push(timestamp);
        this.applianceData[appliance_id].powerUsages.push(powerUsagePerMinute);
      }
    }
  }

  prepareChartData() {
    const period = this.selectedPeriod;
    let labelsArray: number[] = [];
    let labels: string[] = [];
    const datasets: any[] = [];

     if (period === 'Hour') {
      labelsArray = Array.from({ length: 24 }, (_, i) => i);
      labels = labelsArray.map(hour => `${hour.toString().padStart(2, '0')}:00`);
    }

    // Prepare datasets for each appliance
    for (const appliance_id in this.applianceData) {
      let data: number[] = [];

      if (period === 'Hour') {
        const hourlyData = new Array(24).fill(0);
        this.applianceData[appliance_id].timestamps.forEach((ts, idx) => {
          const date = new Date(ts * 1000);
          const hour = date.getHours();
          hourlyData[hour] += this.applianceData[appliance_id].powerUsages[idx];
        });
        data = hourlyData;
      } 

      datasets.push({
        label: this.household.appliances.find((a: { macAddress: string; }) => a.macAddress === appliance_id)?.appliance || appliance_id,
        data: data,
        borderColor: this.getRandomColor(),
        fill: false,
        yAxisID: 'y1',
      });
    }

    // Prepare price data
    let priceData: number[] = [];

    if (period === 'Hour') {
      priceData = this.prices;
    } 

    datasets.push({
      label: 'Price',
      data: priceData,
      borderColor: 'red',
      fill: false,
      yAxisID: 'y2',
    });

    this.chartData = {
      labels: labels,
      datasets: datasets,
    };

    // Update chart options
    this.mainChart = {
      type: 'line',
      data: this.chartData,
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Power Usage (kWh)',
            },
            min:0
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Price ($)',
            },
            grid: {
              drawOnChartArea: false,
            },
            min:0
          },
        },
      },
    };
  }

  getRandomColor() {
    // Function to generate random colors for datasets
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  setTrafficPeriod(value: string): void {
    this.selectedPeriod = value as 'Hour';
    this.prepareChartData();
  }
  async currentAuthenticatedUser() {
    try {
      const { username, userId, signInDetails } = await getCurrentUser();
      this.userEmail = signInDetails?.loginId ?? '';
      console.log(this.userEmail);
    } catch (err) {
      console.log(err);
    }
  }

  async fetchTelemetryData() {
    try {
      for (const mac of this.household.appliances) {
        const formattedMacAddress = mac.macAddress.replace(/:/g, '-');
        const folderPath = `testing-data/${formattedMacAddress}/`;
        console.log("Folder path", folderPath);
        try {
          const result = await list({
            path: folderPath
          });
          const files = result?.items || [];
          for (const file of files) {
            if (file.path.endsWith('.json')) {
              try {
                const { body } = await downloadData({ path: file.path }).result;
                const reader = new FileReader();
                reader.onload = () => {
                  const jsonContent = reader.result as string;
                  const jsonData = JSON.parse(jsonContent) as TelemetryData;
                  this.telemetryData.push(jsonData);
                };
                reader.readAsText(body as unknown as Blob);
              } catch (error) {
                console.error(`Error fetching file ${file.path}:`, error);
              }
            }
          }
        } catch (listError) {
          console.error(`Error listing files in path ${folderPath}:`, listError);
        }
      }
    } catch (error) {
      console.error('Error fetching telemetry data for household:', error);
    }
  }

  openApplianceModal(modal: any, appliance: any) {
    this.selectedAppliance = appliance;
    this.modalService.open(modal, { ariaLabelledBy: 'modal-basic-title' });
  }

  onPowerLevelChange() {
    const currentDate = new Date();
    console.log("Current Date: ", currentDate);
    this.timestamp = this.applianceForm.get('powerLevel')?.dirty
      ? currentDate.toISOString()
      : null;
  }

  async submitApplianceSettings(modal: any) {
    const applianceData = this.applianceForm.value;
    applianceData.timestamp = this.timestamp;
    const topic = '$aws/things/Home_Host_Thing/shadow/name/'+this.selectedAppliance.macAddress+'/update';
    const message = {
      "state": {
        "desired": {
           "appliance": this.selectedAppliance.appliance,
           "appliance_id": this.selectedAppliance.macAddress,
           "power_level": applianceData.powerLevel,
           "priority": applianceData.priority,
           "scheduled_runtime": applianceData.turnOnTime,
           "scheduled_runtime_level": applianceData.turnOnTimeLevel,
           "runtime_duration": applianceData.duration,
           "timestamp": applianceData.timestamp,
        }
      }
    }
    try {
      Hub.listen('pubsub', (data: any) => {
        const { payload } = data;
        if (payload.event === CONNECTION_STATE_CHANGE) {
          const connectionState = payload.data.connectionState as ConnectionState;
          console.log(connectionState);
        }
      });
      await pubsub.publish({ 
        topics: topic,
        message: message
      });
      console.log('TOPIC:', topic);
      console.log('Message sent to IoT Core:', message);
      modal.close();
      this.timestamp = null
      this.snackBar.open('Data Sent to Appliance '+this.selectedAppliance.appliance, 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
    } catch (error) {
      console.error('Error sending message to IoT Core:', error);
    }
  }

    // async getHeaders(): Promise<HttpHeaders> {
  //   return fetchAuthSession().then((info) => {
  //     const cognitoIdentityId = info.identityId;
  //     console.log("Cognito Identity: ",info);

  //     const token = info.credentials?.sessionToken || '';
  //     return new HttpHeaders({
  //       'Authorization': token,
  //       'Content-Type': 'application/json'
  //     });
  //   });
  // }

  // // Fetch data from Lambda URL
  // async fetchCustomPricingData() {
    
  //   try {
  //     const headers = await this.getHeaders(); // Use headers only if Lambda requires auth
  //     console.log("Headers : ",headers);
  //     const response = await this.http.get(this.lambdaUrl, { headers }).toPromise();
  //     console.log("Response: ", response);
  //     // Parsing JSON body
  //     const data = (response as any).body;
  //     console.log("Pricing data:", data.prices); // Access prices array
  //     return data.prices;
  //   } catch (error) {
  //     console.error("Error fetching pricing data:", error);
  //   }
  // }
}
