import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoggerService } from '../logging/logger.service';
import { AuthInterceptor, authInterceptor } from './auth.interceptor';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

describe(`AuthHttpInterceptor`, () => {
  let httpTestingController: HttpTestingController;
  let configurationService: ConfigurationService;
  let httpClient: HttpClient;
  let authStateService: AuthStateService;
  let closestMatchingRouteService: ClosestMatchingRouteService;

  describe(`with Class Interceptor`, () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          ClosestMatchingRouteService,
          {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
          },
          mockProvider(AuthStateService),
          mockProvider(LoggerService),
          mockProvider(ConfigurationService),
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      });

      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
      configurationService = TestBed.inject(ConfigurationService);
      authStateService = TestBed.inject(AuthStateService);
      closestMatchingRouteService = TestBed.inject(ClosestMatchingRouteService);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    runTests();
  });

  describe(`with Functional Interceptor`, () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ClosestMatchingRouteService,
          provideHttpClient(withInterceptors([authInterceptor()])),
          provideHttpClientTesting(),
          mockProvider(AuthStateService),
          mockProvider(LoggerService),
          mockProvider(ConfigurationService),
        ],
      });

      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
      configurationService = TestBed.inject(ConfigurationService);
      authStateService = TestBed.inject(AuthStateService);
      closestMatchingRouteService = TestBed.inject(ClosestMatchingRouteService);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    runTests();
  });

  function runTests(): void {
    it('should add an Authorization header when route matches and token is present', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');
      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(true);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when `secureRoutes` is not given', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
        },
      ]);
      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');
      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when no routes configured', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [],
          configId: 'configId1',
        },
      ]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when no routes configured', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [],
          configId: 'configId1',
        },
      ]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when route is configured but no token is present', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
      spyOn(authStateService, 'getAccessToken').and.returnValue('');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when no config is present', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(false);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should not add an Authorization header when no configured route is matching the request', waitForAsync(() => {
      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);
      spyOn(
        closestMatchingRouteService,
        'getConfigIdForClosestMatchingRoute',
      ).and.returnValue({
        matchingRoute: null,
        matchingConfig: null,
      });

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    }));

    it('should add an Authorization header when multiple routes are configured and token is present', waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      const actionUrl2 = `https://some-other-url.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([
        { secureRoutes: [actionUrl, actionUrl2], configId: 'configId1' },
      ]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');
      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      httpClient.get(actionUrl2).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(true);

      const httpRequest2 = httpTestingController.expectOne(actionUrl2);

      expect(httpRequest2.request.headers.has('Authorization')).toEqual(true);

      httpRequest.flush('something');
      httpRequest2.flush('something');
      httpTestingController.verify();
    }));
  }
});
