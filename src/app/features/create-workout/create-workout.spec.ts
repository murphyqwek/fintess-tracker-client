import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkout } from './create-workout';

describe('CreateWorkout', () => {
  let component: CreateWorkout;
  let fixture: ComponentFixture<CreateWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorkout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWorkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
