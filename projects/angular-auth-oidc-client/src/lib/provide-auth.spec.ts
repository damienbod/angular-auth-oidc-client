import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../test/auto-mock';
import { PASSED_CONFIG } from './auth-config';
import { ConfigurationService } from './config/config.service';
import {
  StsConfigHttpLoader,
  StsConfigLoader,
  StsConfigStaticLoader,
} from './config/loader/config-loader';
import { provideAuth } from './provide-auth';

describe('provideAuth', () => {
  describe('APP_CONFIG', () => {
    let config: any;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          provideAuth({ config: { authority: 'something' } }),
          {
            provide: ConfigurationService,
            useClass: mockClass(ConfigurationService),
          },
        ],
      }).compileComponents();
    }));

    it('should provide config', () => {
      config = TestBed.inject(PASSED_CONFIG);
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
          {
            provide: ConfigurationService,
            useClass: mockClass(ConfigurationService),
          },
        ],
      }).compileComponents();
    }));

    it('should create StsConfigStaticLoader if config is passed', () => {
      const configLoader = TestBed.inject(StsConfigLoader);

      expect(configLoader instanceof StsConfigHttpLoader).toBe(true);
    });
  });
});
