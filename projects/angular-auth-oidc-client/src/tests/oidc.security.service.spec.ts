import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { filter, skipWhile } from 'rxjs/operators';
import { OpenIdConfiguration } from '../lib/angular-auth-oidc-client';
import { AuthModule } from '../lib/auth.module';
import { ConfigurationProvider } from '../lib/config';
import { LoggerService } from '../lib/logging/logger.service';
import { LoggerServiceMock } from '../lib/logging/logger.service-mock';
import { IFrameService } from '../lib/services/existing-iframe.service';
import { OidcSecurityService } from '../lib/services/oidc.security.service';
import { AbstractSecurityStorage, StoragePersistanceService } from '../lib/storage';
import { BrowserStorageMock } from '../lib/storage/browser-storage.service-mock';
import { UrlService } from '../lib/utils';

describe('OidcSecurityService', () => {
    let oidcSecurityService: OidcSecurityService;
    let configurationProvider: ConfigurationProvider;
    let storagePersistanceService: StoragePersistanceService;
    let urlService: UrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                OidcSecurityService,
                {
                    provide: AbstractSecurityStorage,
                    useClass: BrowserStorageMock,
                },
                { provide: LoggerService, useClass: LoggerServiceMock },
                UrlService,
                ConfigurationProvider,
                IFrameService,
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityService = TestBed.inject(OidcSecurityService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        urlService = TestBed.inject(UrlService);
    });

    it('should create', () => {
        expect(oidcSecurityService).toBeTruthy();
    });

    it('authorizedImplicitFlowCallback should correctly parse hash params', () => {
        spyOn(oidcSecurityService as any, 'getSigningKeys').and.returnValue(of(null));

        const config = {
            silentRenew: false,
            stsServer: 'https://localhost:5001',
        };

        const resultSetter = spyOnProperty((oidcSecurityService as any).storagePersistanceService, 'authResult', 'set');

        let hash = 'access_token=ACCESS-TOKEN&token_type=bearer&state=testState';
        const expectedResult = {
            access_token: 'ACCESS-TOKEN',
            token_type: 'bearer',
            state: 'testState',
        };

        configurationProvider.setConfig(config, null);

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);

        expect(resultSetter).not.toHaveBeenCalled();

        (oidcSecurityService as any).isModuleSetupInternal.next(true);

        expect(resultSetter).toHaveBeenCalledWith(expectedResult);

        // with '=' chars in values
        hash = 'access_token=ACCESS-TOKEN==&token_type=bearer&state=test=State';
        expectedResult.access_token = 'ACCESS-TOKEN==';
        expectedResult.state = 'test=State';

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);
        expect(resultSetter).toHaveBeenCalledWith(expectedResult);
    });

    it('logoff should call urlHandler', () => {
        const authwellknown = {
            endSessionEndpoint: 'some_endpoint',
        };

        const logoffUrl = 'http://some_logoff_url';

        configurationProvider.setConfig(null, authwellknown);

        // TODO CHECK THOSE PORPERTIES
        spyOn(urlService, 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');

        let hasBeenCalled = false;

        (oidcSecurityService as OidcSecurityService).logoff((url: string) => {
            expect(url).toEqual(logoffUrl);
            hasBeenCalled = true;
        });

        expect(hasBeenCalled).toEqual(true);
        expect(redirectToSpy).not.toHaveBeenCalled();
    });

    it('logoff should redirect', () => {
        const authwellknown = {
            endSessionEndpoint: 'some_endpoint',
        };

        const logoffUrl = 'http://some_logoff_url';

        configurationProvider.setConfig(null, authwellknown);

        spyOn(urlService, 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');

        (oidcSecurityService as OidcSecurityService).logoff();

        expect(redirectToSpy).toHaveBeenCalledWith(logoffUrl);
    });

    it('logoff should reset storage data before emitting an isAuthorizedInternal change', () => {
        const authwellknown = {};

        const resetStorageData = spyOn((oidcSecurityService as any).storagePersistanceService, 'resetStorageData');
        configurationProvider.setConfig(null, authwellknown);
        let hasBeenCalled = false;
        (oidcSecurityService as any).isAuthorizedInternal
            .pipe(
                skipWhile((isAuthorized: boolean) => !isAuthorized),
                filter((isAuthorized: boolean) => !isAuthorized)
            )
            .subscribe(() => {
                expect(resetStorageData).toHaveBeenCalled();
                hasBeenCalled = true;
            });

        expect(hasBeenCalled).toEqual(false);

        (oidcSecurityService as any).isAuthorizedInternal.next(true);
        (oidcSecurityService as OidcSecurityService).logoff();

        expect(hasBeenCalled).toEqual(true);
    });

    it('authorizedCallbackWithCode handles url correctly when hash at the end', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';

        const spy = spyOn(oidcSecurityService, 'requestTokensWithCode$').and.callThrough();
        oidcSecurityService.authorizedCallbackWithCode(urlToCheck);

        expect(spy).toHaveBeenCalledWith('thisisacode', '0000.1234.000', null);
    });
    it('refresh session with refresh token should call authorized callback with isRenew running to true', (done) => {
        const config = {} as OpenIdConfiguration;
        config.responseType = 'code';
        config.silentRenew = true;
        config.useRefreshToken = true;
        config.stsServer = 'https://localhost:5001';
        config.silentRenewOffsetInSeconds = 0;
        configurationProvider.setConfig(config, null);

        spyOn(oidcSecurityService as any, 'refreshTokensWithCodeProcedure').and.returnValue(of(true));
        spyOn(storagePersistanceService as any, 'getRefreshToken').and.returnValue('refresh token');
        oidcSecurityService.refreshSession().subscribe(() => {
            expect(storagePersistanceService.silentRenewRunning).toBe('running');
            done();
        });
    });
});
