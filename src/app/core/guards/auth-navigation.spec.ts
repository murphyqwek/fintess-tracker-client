import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { regLoginGuard } from './reg.login.guard';

@Component({ template: 'Protected page' })
class ProtectedPage {}

@Component({ template: 'Login page' })
class LoginPage {}

describe('authentication navigation', () => {
  let requests: HttpTestingController;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: ProtectedPage, canActivate: [authGuard] },
          { path: 'login', component: LoginPage, canActivate: [regLoginGuard] },
          { path: 'register', component: LoginPage, canActivate: [regLoginGuard] },
        ]),
      ],
    });
    requests = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => requests.verify());

  async function rejectSessionCheck(): Promise<void> {
    await Promise.resolve();
    requests.expectOne('api/v1/test-auth').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush('Refresh token is missing', {
      status: 401, statusText: 'Unauthorized',
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  for (const url of ['/login', '/register']) {
    it(`opens ${url} without cookies without starting another navigation`, async () => {
      const imperativeNavigation = spyOn(router, 'navigate').and.callThrough();
      const navigation = harness.navigateByUrl(url);
      await rejectSessionCheck();

      expect(imperativeNavigation).not.toHaveBeenCalled();
      const extraChecks = requests.match('api/v1/test-auth');
      expect(extraChecks.length).toBe(0);
      // Complete unexpected requests so a regression fails without leaving a navigation loop running.
      extraChecks.forEach(req => req.flush({ id: 'user-id', login: 'user' }));
      if (extraChecks.length > 0) {
        router.dispose();
        return;
      }

      await navigation;
      expect(router.url).toBe(url);
      expect(harness.routeNativeElement?.textContent).toContain('Login page');
    });
  }

  it('redirects an anonymous visit to the home page to login', async () => {
    const imperativeNavigation = spyOn(router, 'navigate').and.callThrough();
    const navigation = harness.navigateByUrl('/');
    await rejectSessionCheck();
    // The login guard also verifies whether an existing session can be restored.
    await rejectSessionCheck();

    expect(imperativeNavigation).not.toHaveBeenCalled();
    const extraChecks = requests.match('api/v1/test-auth');
    expect(extraChecks.length).toBe(0);
    extraChecks.forEach(req => req.flush({ id: 'user-id', login: 'user' }));
    if (extraChecks.length > 0) {
      router.dispose();
      return;
    }

    await navigation;
    expect(router.url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Login page');
    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
  });

  it('opens a protected page after restoring an expired access token', async () => {
    const navigation = harness.navigateByUrl('/');
    await Promise.resolve();
    requests.expectOne('api/v1/test-auth').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush(null);
    requests.expectOne('api/v1/test-auth').flush({ id: 'user-id', login: 'user' });

    await navigation;
    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Protected page');
  });

  it('redirects to login when refresh fails during work on a protected page', async () => {
    const navigation = harness.navigateByUrl('/');
    await Promise.resolve();
    requests.expectOne('api/v1/test-auth').flush({ id: 'user-id', login: 'user' });
    await navigation;

    TestBed.inject(HttpClient).get('/api/v1/data').subscribe({ error: () => {} });
    requests.expectOne('/api/v1/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('api/v1/auth/refresh').flush('Refresh token is missing', {
      status: 401, statusText: 'Unauthorized',
    });
    await rejectSessionCheck();

    const extraChecks = requests.match('api/v1/test-auth');
    expect(extraChecks.length).toBe(0);
    extraChecks.forEach(req => req.flush({ id: 'user-id', login: 'user' }));
    if (extraChecks.length > 0) {
      router.dispose();
      return;
    }

    expect(router.url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Login page');
  });
});
