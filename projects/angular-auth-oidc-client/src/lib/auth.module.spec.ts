import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthModule } from './auth.module';
import { PASSED_CONFIG } from './passed-config/passed-config';
import { OidcConfigService } from './config/config.service';
import { OidcConfigServiceMock } from './config/config.service.mock';
import { StsConfigHttpLoader, StsConfigLoader, StsConfigStaticLoader } from './config/loader/config-loader';

describe('AuthModule', () => {
  describe('APP_CONFIG', () => {
    let config: any;

    beforeEach(
      waitForAsync(() => {
        TestBed.configureTestingModule({
          imports: [AuthModule.forRoot({ config: { authority: 'something' } })],
          providers: [{ provide: OidcConfigService, useClass: OidcConfigServiceMock }],
        }).compileComponents();
      })
    );

    it('should create', () => {
      expect(AuthModule).toBeDefined();
      expect(AuthModule.forRoot(null)).toBeDefined();
    });

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
    beforeEach(
      waitForAsync(() => {
        TestBed.configureTestingModule({
          imports: [
            AuthModule.forRoot({
              loader: {
                provide: StsConfigLoader,
                useFactory: () => new StsConfigHttpLoader(of(null).toPromise()),
              },
            }),
          ],
          providers: [{ provide: OidcConfigService, useClass: OidcConfigServiceMock }],
        }).compileComponents();
      })
    );

    it('should create StsConfigStaticLoader if config is passed', () => {
      const configLoader = TestBed.inject(StsConfigLoader);
      expect(configLoader instanceof StsConfigHttpLoader).toBe(true);
    });
  });
});
