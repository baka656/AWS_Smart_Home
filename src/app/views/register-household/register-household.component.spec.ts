import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterHouseholdComponent } from './register-household.component';

describe('RegisterHouseholdComponent', () => {
  let component: RegisterHouseholdComponent;
  let fixture: ComponentFixture<RegisterHouseholdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterHouseholdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterHouseholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
