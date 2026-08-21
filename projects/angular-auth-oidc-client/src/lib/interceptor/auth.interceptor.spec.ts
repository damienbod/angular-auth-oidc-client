import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
    it('should add an Authorization header when route matches and token is present', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);

      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'thisIsAToken'
      );
      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(true);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when `secureRoutes` is not given', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          configId: 'configId1',
        },
      ]);
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'thisIsAToken'
      );
      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when no routes configured', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          secureRoutes: [],
          configId: 'configId1',
        },
      ]);

      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'thisIsAToken'
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when no routes configured', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          secureRoutes: [],
          configId: 'configId1',
        },
      ]);

      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when route is configured but no token is present', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);

      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('');

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when no config is present', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        false
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should not add an Authorization header when no configured route is matching the request', () => {
      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      let response: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId1',
        },
      ]);
      vi.spyOn(
        closestMatchingRouteService,
        'getConfigIdForClosestMatchingRoute'
      ).mockReturnValue({
        matchingRoute: null,
        matchingConfig: null,
      });

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');

      expect(response).toBeTruthy();
      httpTestingController.verify();
    });

    it('should add an Authorization header when multiple routes are configured and token is present', () => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      const actionUrl2 = `https://some-other-url.com/`;
      let response: unknown;
      let response2: unknown;

      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue([
        { secureRoutes: [actionUrl, actionUrl2], configId: 'configId1' },
      ]);

      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'thisIsAToken'
      );
      vi.spyOn(configurationService, 'hasAtLeastOneConfig').mockReturnValue(
        true
      );

      httpClient.get(actionUrl).subscribe((data) => {
        response = data;
      });

      httpClient.get(actionUrl2).subscribe((data) => {
        response2 = data;
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);

      expect(httpRequest.request.headers.has('Authorization')).toEqual(true);

      const httpRequest2 = httpTestingController.expectOne(actionUrl2);

      expect(httpRequest2.request.headers.has('Authorization')).toEqual(true);

      httpRequest.flush('something');
      httpRequest2.flush('something');

      expect(response).toBeTruthy();
      expect(response2).toBeTruthy();
      httpTestingController.verify();
    });
  }
});
