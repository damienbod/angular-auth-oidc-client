import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../auth-state/auth-state.service-mock';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AuthInterceptor } from './auth.interceptor';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

describe(`AuthHttpInterceptor`, () => {
  let httpTestingController: HttpTestingController;
  let configurationProvider: ConfigurationProvider;
  let httpClient: HttpClient;
  let authStateService: AuthStateService;
  let closestMatchingRouteService: ClosestMatchingRouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClosestMatchingRouteService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authStateService = TestBed.inject(AuthStateService);
    closestMatchingRouteService = TestBed.inject(ClosestMatchingRouteService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(
    'should add an Authorization header when route matches and token is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          secureRoutes: [actionUrl],
          configId: 'configId',
        },
      ]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(true);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when `secureRoutes` is not given',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId',
        },
      ]);
      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when no routes configured',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ secureRoutes: [], configId: 'configId' }]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when no routes configured and no token is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ secureRoutes: [], configId: 'configId' }]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when route is configured and no token is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ secureRoutes: [actionUrl], configId: 'configId' }]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('');

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when no config is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(false);

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should not add an Authorization header when no configured route is matching the request',
    waitForAsync(() => {
      spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ secureRoutes: [actionUrl], configId: 'configId' }]);
      spyOn(closestMatchingRouteService, 'getConfigIdForClosestMatchingRoute').and.returnValue({
        matchingRoute: null,
        matchingConfigId: null,
      });

      httpClient.get(actionUrl).subscribe((response) => {
        expect(response).toBeTruthy();
      });

      const httpRequest = httpTestingController.expectOne(actionUrl);
      expect(httpRequest.request.headers.has('Authorization')).toEqual(false);

      httpRequest.flush('something');
      httpTestingController.verify();
    })
  );

  it(
    'should add an Authorization header when multiple routes are configured and token is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;
      const actionUrl2 = `https://some-other-url.com/`;

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { secureRoutes: [actionUrl, actionUrl2], configId: 'configId' },
      ]);

      spyOn(authStateService, 'getAccessToken').and.returnValue('thisIsAToken');

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
    })
  );
});
