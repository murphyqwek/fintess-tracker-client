import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor refresh flow', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let auth: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.currentUser.set({ id: 'user-id', login: 'user' });
  });

  afterEach(() => requests.verify());

  it('retries all concurrent unauthorized requests after an empty refresh response', () => {
    const responses: string[] = [];
    http.get('/api/v1/first').subscribe(() => responses.push('first'));
    http.get('/api/v1/second').subscribe(() => responses.push('second'));

    requests.expectOne('/api/v1/first').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('/api/v1/second').flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = requests.expectOne('api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBeTrue();
    refresh.flush(null);

    const retried = requests.match(req => ['/api/v1/first', '/api/v1/second'].includes(req.url));
    expect(retried.length).toBe(2);
    retried.forEach(req => {
      expect(req.request.withCredentials).toBeTrue();
      req.flush({});
    });
    expect(responses.sort()).toEqual(['first', 'second']);
  });

  it('fails every waiting request and clears the session when refresh is rejected', () => {
    const errors: HttpErrorResponse[] = [];
    http.get('/api/v1/first').subscribe({ error: err => errors.push(err) });
    http.get('/api/v1/second').subscribe({ error: err => errors.push(err) });
    requests.expectOne('/api/v1/first').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('/api/v1/second').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errors.length).toBe(2);
    expect(errors.every(err => err.status === 401)).toBeTrue();
    expect(auth.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    requests.expectNone('api/v1/auth/logout');
  });

  it('can refresh again after the previous refresh has completed', () => {
    for (let index = 0; index < 2; index++) {
      let completed = false;
      http.get('/api/v1/data').subscribe(() => completed = true);
      requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
      requests.expectOne('api/v1/auth/refresh').flush(null);
      requests.expectOne('/api/v1/data').flush({});
      expect(completed).toBeTrue();
    }
  });

  it('allows a new refresh attempt after a temporary server failure', () => {
    let error: HttpErrorResponse | undefined;
    http.get('/api/v1/data').subscribe({ error: err => error = err });
    requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(error?.status).toBe(503);
    expect(auth.isAuthenticated()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();

    let completed = false;
    http.get('/api/v1/data').subscribe(() => completed = true);
    requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush(null);
    requests.expectOne('/api/v1/data').flush({});
    expect(completed).toBeTrue();
  });

  it('does not start another refresh when the retried request is still unauthorized', () => {
    let error: HttpErrorResponse | undefined;
    http.get('/api/v1/data').subscribe({ error: err => error = err });
    requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush(null);
    requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(error?.status).toBe(401);
    requests.expectNone('api/v1/auth/refresh');
    expect(auth.isAuthenticated()).toBeTrue();
  });
});
