import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseSearch } from './exercise-search';

describe('ExerciseSearch', () => {
  let component: ExerciseSearch;
  let fixture: ComponentFixture<ExerciseSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
