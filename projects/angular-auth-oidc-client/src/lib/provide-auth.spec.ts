import { APP_INITIALIZER } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../test/auto-mock';
import { PASSED_CONFIG } from './auth-config';
import { ConfigurationService } from './config/config.service';
import {
  StsConfigHttpLoader,
  StsConfigLoader,
  StsConfigStaticLoader,
} from './config/loader/config-loader';
import { OidcSecurityService } from './oidc.security.service';
import { provideAuth, withAppInitializerAuthCheck } from './provide-auth';

describe('provideAuth', () => {
  describe('APP_CONFIG', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          provideAuth({ config: { authority: 'something' } }),
          mockProvider(ConfigurationService),
        ],
      }).compileComponents();
    }));

    it('should provide config', () => {
      const config = TestBed.inject(PASSED_CONFIG);

      expect(config).toEqual({ config: { authority: 'something' } });
    });

    it('should create StsConfigStaticLoader if config is passed', () => {
      const configLoader = TestBed.inject(StsConfigLoader);

      expect(configLoader instanceof StsConfigStaticLoader).toBe(true);
    });
  });

  describe('StsConfigHttpLoader', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          provideAuth({
            loader: {
              provide: StsConfigLoader,
              useFactory: () => new StsConfigHttpLoader(of({})),
            },
          }),
          mockProvider(ConfigurationService),
        ],
      }).compileComponents();
    }));

    it('should create StsConfigStaticLoader if config is passed', () => {
      const configLoader = TestBed.inject(StsConfigLoader);

      expect(configLoader instanceof StsConfigHttpLoader).toBe(true);
    });
  });

  describe('features', () => {
    let oidcSecurityServiceMock: jasmine.SpyObj<OidcSecurityService>;

    beforeEach(waitForAsync(() => {
      oidcSecurityServiceMock = jasmine.createSpyObj<OidcSecurityService>(
        'OidcSecurityService',
        ['checkAuthMultiple']
      );
      TestBed.configureTestingModule({
        providers: [
          provideAuth(
            { config: { authority: 'something' } },
            withAppInitializerAuthCheck()
          ),
          mockProvider(ConfigurationService),
          {
            provide: OidcSecurityService,
            useValue: oidcSecurityServiceMock,
          },
        ],
      }).compileComponents();
    }));

    it('should provide APP_INITIALIZER config', () => {
      const config = TestBed.inject(APP_INITIALIZER);

      expect(config.length)
        .withContext('Expected an APP_INITIALIZER to be registered')
        .toBe(1);
      expect(oidcSecurityServiceMock.checkAuthMultiple).toHaveBeenCalledTimes(
        1
      );
    });
  });
});
