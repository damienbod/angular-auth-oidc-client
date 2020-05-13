import { CommonModule } from '@angular/common';
import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../config/auth-well-known.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { RedirectService } from '../utils/redirect/redirect.service';
import { RedirectServiceMock } from '../utils/redirect/redirect.service-mock';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { LoginService } from './login.service';

describe('LoginService', () => {
    let storagePersistanceService: StoragePersistanceService;
    let loginService: LoginService;
    let configurationProvider: ConfigurationProvider;
    let urlService: UrlService;
    let loggerService: LoggerService;
    let tokenValidationService: TokenValidationService;
    let flowsService: FlowsService;
    let redirectService: RedirectService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CommonModule],
            providers: [
                LoginService,
                {
                    provide: StoragePersistanceService,
                    useClass: StoragePersistanceServiceMock,
                },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
                { provide: TokenValidationService, useClass: TokenValidationServiceMock },
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: RedirectService, useClass: RedirectServiceMock },
            ],
        });
    });

    beforeEach(() => {
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        loginService = TestBed.inject(LoginService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        urlService = TestBed.inject(UrlService);
        loggerService = TestBed.inject(LoggerService);
        tokenValidationService = TestBed.inject(TokenValidationService);
        flowsService = TestBed.inject(FlowsService);
        redirectService = TestBed.inject(RedirectService);
    });

    it('should create', () => {
        expect(loginService).toBeTruthy();
    });

    describe('login', () => {
        it('does nothing if it has an invalid response type', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(false);
            const loggerSpy = spyOn(loggerService, 'logError');
            const result = loginService.login();
            expect(result).toBeUndefined();
            expect(loggerSpy).toHaveBeenCalled();
        }));

        it('does nothing if no well known endpoint is given', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
            const spy = spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            const result = loginService.login();
            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalled();
        }));

        it('calls flowsService.resetAuthorizationData() if everything fits', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
                authWellknownEndpoint: 'authWellknownEndpoint',
                responseType: 'stubValue',
            });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            spyOn(loginService as any, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
            const spy = spyOn(flowsService, 'resetAuthorizationData').and.callFake(() => {});
            spyOn(redirectService, 'redirectTo').and.callFake(() => {});
            const result = loginService.login();
            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalled();
        }));

        it('calls urlService.getAuthorizeUrl() if everything fits', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
                authWellknownEndpoint: 'authWellknownEndpoint',
                responseType: 'stubValue',
            });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            spyOn(loginService as any, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
            spyOn(flowsService, 'resetAuthorizationData').and.callFake(() => {});
            const spy = spyOn(urlService, 'getAuthorizeUrl');
            spyOn(redirectService, 'redirectTo').and.callFake(() => {});
            const result = loginService.login();
            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalled();
        }));

        it('redirects to url with no url handler', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
                authWellknownEndpoint: 'authWellknownEndpoint',
                responseType: 'stubValue',
            });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            spyOn(loginService as any, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
            spyOn(flowsService, 'resetAuthorizationData').and.callFake(() => {});
            spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
            const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
            const result = loginService.login();
            expect(result).toBeUndefined();
            expect(redirectspy).toHaveBeenCalledWith('someUrl');
        }));

        it('redirects to url with url handler when urlhandler is given', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
                authWellknownEndpoint: 'authWellknownEndpoint',
                responseType: 'stubValue',
            });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            spyOn(loginService as any, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
            spyOn(flowsService, 'resetAuthorizationData').and.callFake(() => {});
            spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
            const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
            const spy = jasmine.createSpy();
            const urlHandler = (url) => {
                spy(url);
            };
            const result = loginService.login({ urlHandler });
            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalledWith('someUrl');
            expect(redirectspy).not.toHaveBeenCalled();
        }));

        it('calls getAuthorizeUrl with custom params if they are given as parameter', async(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
                authWellknownEndpoint: 'authWellknownEndpoint',
                responseType: 'stubValue',
            });
            spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
            spyOn(loginService as any, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
            spyOn(flowsService, 'resetAuthorizationData').and.callFake(() => {});
            const getAuthorizeUrlSpy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
            const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});

            const result = loginService.login({ customParams: { to: 'add', as: 'well' } });
            expect(result).toBeUndefined();
            expect(redirectspy).toHaveBeenCalledWith('someUrl');
            expect(getAuthorizeUrlSpy).toHaveBeenCalledWith({ to: 'add', as: 'well' });
        }));
    });
});
