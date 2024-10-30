import { TestBed } from '@angular/core/testing';

import { DashboardAuthService } from './dashboard-auth.service';

describe('DashboardAuthService', () => {
  let service: DashboardAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
