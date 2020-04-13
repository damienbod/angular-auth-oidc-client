import { TestBed } from '@angular/core/testing';
import { OpenIdConfiguration } from '../../lib/models/auth.configuration';
import { AuthModule } from '../../lib/modules/auth.module';
import { ConfigurationProvider } from '../../lib/services/auth-configuration.provider';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { PlatformProvider } from '../../lib/services/platform.provider';
import { TestLogging } from '../common/test-logging.service';

describe('AuthConfiguration', () => {
    let configurationProvider: ConfigurationProvider;
    let platformProvider: PlatformProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AuthModule.forRoot()],
            providers: [
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
                ConfigurationProvider,
                PlatformProvider,
            ],
        });

        configurationProvider = TestBed.inject(ConfigurationProvider);
        platformProvider = TestBed.inject(PlatformProvider);
    });

    it('silent_renew and start_checksession can be set to true when using the browser platform', () => {
        const config: OpenIdConfiguration = {
            silent_renew: true,
            start_checksession: true,
            use_refresh_token: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(true);

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration.silent_renew).toEqual(true);
        expect(configurationProvider.openIDConfiguration.start_checksession).toEqual(true);
    });

    it('silent_renew and start_checksession are always false when not using the browser platform', () => {
        const config: OpenIdConfiguration = {
            silent_renew: true,
            start_checksession: true,
            use_refresh_token: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration.silent_renew).toEqual(false);
        expect(configurationProvider.openIDConfiguration.start_checksession).toEqual(false);
    });
});
