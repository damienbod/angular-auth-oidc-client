import { TestBed } from '@angular/core/testing';
import { AuthModule } from '../../lib/auth.module';
import { ConfigurationProvider } from '../../lib/config';
import { OpenIdConfiguration } from '../../lib/config/openid-configuration';
import { LoggerService } from '../../lib/logging/logger.service';
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
            silentRenew: true,
            stsServer: '',
            startCheckSession: true,
            useRefreshToken: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(true);

        configurationProvider.setConfig(config, null);

        expect(configurationProvider.openIDConfiguration.silentRenew).toEqual(true);
        expect(configurationProvider.openIDConfiguration.startCheckSession).toEqual(true);
    });

    it('silent_renew and start_checksession are always false when not using the browser platform', () => {
        const config: OpenIdConfiguration = {
            silentRenew: true,
            stsServer: '',
            startCheckSession: true,
            useRefreshToken: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setConfig(config, null);

        expect(configurationProvider.openIDConfiguration.silentRenew).toEqual(false);
        expect(configurationProvider.openIDConfiguration.startCheckSession).toEqual(false);
    });
});
