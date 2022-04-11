import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../test/auto-mock';
import { LoggerService } from './../logging/logger.service';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

describe('ClosestMatchingRouteService', () => {
  let service: ClosestMatchingRouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClosestMatchingRouteService,
        {
          provide: LoggerService,
          useClass: mockClass(LoggerService),
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ClosestMatchingRouteService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getConfigForClosestMatchingRoute', () => {
    it('gets best match for configured routes', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-third-secure-url.com/', 'https://my-fourth-second-secure-url.com/'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/', allConfigs);

      expect(matchingConfig).toEqual(allConfigs[0]);
    });

    it('gets best match for configured routes - same route prefix', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-third-secure-url.com/', 'https://my-fourth-second-secure-url.com/'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/', allConfigs);

      expect(matchingConfig).toEqual(allConfigs[0]);
    });

    it('gets best match for configured routes - main route', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://first-route.com/', 'https://second-route.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://third-route.com/test2', 'https://fourth-route.com/test3'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('https://first-route.com/', allConfigs);

      expect(matchingConfig).toEqual(allConfigs[0]);
    });

    it('gets best match for configured routes - request route with params', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://first-route.com/', 'https://second-route.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://third-route.com/test2', 'https://fourth-route.com/test3'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('https://first-route.com/anyparam', allConfigs);

      expect(matchingConfig).toEqual(allConfigs[0]);
    });

    it('gets best match for configured routes - configured route with params', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://first-route.com/', 'https://second-route.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://third-route.com/test2', 'https://fourth-route.com/test3'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('https://third-route.com/', allConfigs);

      expect(matchingConfig).toBeNull();
    });

    it('gets best match for configured routes - no config Id', () => {
      const allConfigs = [
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-secure-url.com/test2', 'https://my-secure-url.com/test2/test'],
        },
      ];

      const { matchingConfig } = service.getConfigIdForClosestMatchingRoute('blabla', allConfigs);

      expect(matchingConfig).toBeNull();
    });
  });
});
