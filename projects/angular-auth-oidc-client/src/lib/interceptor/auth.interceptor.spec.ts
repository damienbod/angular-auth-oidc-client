import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../auth-state/auth-state.service-mock';
import { ConfigurationService } from '../config/config.service';
import { ConfigurationServiceMock } from '../config/config.service.mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AuthInterceptor } from './auth.interceptor';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

describe(`AuthHttpInterceptor`, () => {
  let httpTestingController: HttpTestingController;
  let configurationService: ConfigurationService;
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
          provide: ConfigurationService,
          useClass: ConfigurationServiceMock,
        },
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

  it(
    'should add an Authorization header when route matches and token is present',
    waitForAsync(() => {
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
    })
  );

  it(
    'should not add an Authorization header when `secureRoutes` is not given',
    waitForAsync(() => {
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
    })
  );

  it(
    'should not add an Authorization header when no routes configured',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([{ secureRoutes: [], configId: 'configId1' }]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
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
      spyOn(configurationService, 'getAllConfigurations').and.returnValue([{ secureRoutes: [], configId: 'configId1' }]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);

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
    'should not add an Authorization header when route is configured but no token is present',
    waitForAsync(() => {
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([{ secureRoutes: [actionUrl], configId: 'configId1' }]);

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
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

      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(false);

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
      spyOn(configurationService, 'hasAtLeastOneConfig').and.returnValue(true);
      const actionUrl = `https://jsonplaceholder.typicode.com/`;

      spyOn(configurationService, 'getAllConfigurations').and.returnValue([{ secureRoutes: [actionUrl], configId: 'configId1' }]);
      spyOn(closestMatchingRouteService, 'getConfigIdForClosestMatchingRoute').and.returnValue({
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
    })
  );

  it(
    'should add an Authorization header when multiple routes are configured and token is present',
    waitForAsync(() => {
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
    })
  );
});
