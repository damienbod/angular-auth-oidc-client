import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { LoggerService } from './../logging/logger.service';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

describe('ClosestMatchingRouteService', () => {
  let service: ClosestMatchingRouteService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClosestMatchingRouteService,
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ClosestMatchingRouteService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getConfigForClosestMatchingRoute', () => {
    it('gets best match for configured routes', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-third-secure-url.com/', 'https://my-fourth-second-secure-url.com/'],
        },
      ]);

      const { matchingConfigId } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/');

      expect(matchingConfigId).toBe('configId1');
    });

    it('gets best match for configured routes - same route prefix', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-third-secure-url.com/', 'https://my-fourth-second-secure-url.com/'],
        },
      ]);

      const { matchingConfigId } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/');

      expect(matchingConfigId).toBe('configId1');
    });

    it('gets best match for configured routes - same routes', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-secure-url.com/test2', 'https://my-secure-url.com/test3'],
        },
      ]);

      const { matchingConfigId } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/test3');

      expect(matchingConfigId).toBe('configId2');
    });

    it('gets best match for configured routes - same route prefix', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-secure-url.com/test2', 'https://my-secure-url.com/test2/test'],
        },
      ]);

      const { matchingConfigId } = service.getConfigIdForClosestMatchingRoute('https://my-secure-url.com/test2');

      expect(matchingConfigId).toBe('configId2');
    });

    it('gets best match for configured routes - no config Id', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        {
          configId: 'configId1',
          secureRoutes: ['https://my-secure-url.com/', 'https://my-secure-url.com/test'],
        },
        {
          configId: 'configId2',
          secureRoutes: ['https://my-secure-url.com/test2', 'https://my-secure-url.com/test2/test'],
        },
      ]);

      const { matchingConfigId } = service.getConfigIdForClosestMatchingRoute('blabla');

      expect(matchingConfigId).toBeNull();
    });
  });
});
