import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes, PublicEventsService } from '../public-events';
import { ConfigurationProvider } from './config.provider';
import { ConfigurationProviderMock } from './config.provider-mock';
import { OidcConfigService } from './config.service';

describe('Configuration Service', () => {
    let oidcConfigService: OidcConfigService;
    let loggerService: LoggerService;
    let eventsService: PublicEventsService;
    let configurationProvider: ConfigurationProvider;
    let dataService: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OidcConfigService,
                {
                    provide: LoggerService,
                    useClass: LoggerServiceMock,
                },
                {
                    provide: ConfigurationProvider,
                    useClass: ConfigurationProviderMock,
                },
                {
                    provide: DataService,
                    useClass: DataServiceMock,
                },
                PublicEventsService,
            ],
        });
    });

    beforeEach(() => {
        oidcConfigService = TestBed.inject(OidcConfigService);
        loggerService = TestBed.inject(LoggerService);
        eventsService = TestBed.inject(PublicEventsService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        dataService = TestBed.inject(DataService);
    });

    it('should create', () => {
        expect(oidcConfigService).toBeTruthy();
    });

    describe('withConfig', () => {
        it('no given sts server does nothing and logs error', () => {
            const config = {};
            spyOn(loggerService, 'logError');

            const promiseReturn = oidcConfigService.withConfig(config);

            expect(promiseReturn).toBeUndefined();
            expect(loggerService.logError).toHaveBeenCalled();
        });

        it('has authWellknownEndpoint but stsServer the sts server is being used', () => {
            const config = {
                stsServer: 'mySTSServer',
            };

            const spy = spyOn(oidcConfigService as any, 'getWellKnownDocument').and.callFake(() => {
                return of({});
            });

            oidcConfigService.withConfig(config);

            expect(spy).toHaveBeenCalledWith(config.stsServer);
        });

        it('maps wellknownendpoints correct', async(() => {
            const config = {
                stsServer: 'mySTSServer',
            };

            const returnedWellKnownEndpoints = {
                issuer: 'isserToTest',
                jwks_uri: 'jwks_uri ToTest',
                authorization_endpoint: 'authorization_endpoint ToTest',
                token_endpoint: 'token_endpoint ToTest',
                userinfo_endpoint: 'userinfo_endpointToTest',
                end_session_endpoint: 'end_session_endpoint ToTest',
                check_session_iframe: 'check_session_iframe ToTest',
                revocation_endpoint: 'revocation_endpoint ToTest',
                introspection_endpoint: 'introspection_endpoint ToTest',
            };

            const expectedWellKnownEndpoints = {
                issuer: returnedWellKnownEndpoints.issuer,
                jwksUri: returnedWellKnownEndpoints.jwks_uri,
                authorizationEndpoint: returnedWellKnownEndpoints.authorization_endpoint,
                tokenEndpoint: returnedWellKnownEndpoints.token_endpoint,
                userinfoEndpoint: returnedWellKnownEndpoints.userinfo_endpoint,
                endSessionEndpoint: returnedWellKnownEndpoints.end_session_endpoint,
                checkSessionIframe: returnedWellKnownEndpoints.check_session_iframe,
                revocationEndpoint: returnedWellKnownEndpoints.revocation_endpoint,
                introspectionEndpoint: returnedWellKnownEndpoints.introspection_endpoint,
            };

            spyOn(oidcConfigService as any, 'getWellKnownDocument').and.callFake(() => {
                return of(returnedWellKnownEndpoints);
            });

            oidcConfigService.withConfig(config).then((result) => {
                expect(result).toEqual(expectedWellKnownEndpoints);
            });
        }));

        it('Fires the ConfigLoaded Event with correct params', async(() => {
            const config = {
                stsServer: 'mySTSServer',
            };

            const returnedWellKnownEndpoints = {
                issuer: 'isserToTest',
                jwks_uri: 'jwks_uri ToTest',
                authorization_endpoint: 'authorization_endpoint ToTest',
                token_endpoint: 'token_endpoint ToTest',
                userinfo_endpoint: 'userinfo_endpointToTest',
                end_session_endpoint: 'end_session_endpoint ToTest',
                check_session_iframe: 'check_session_iframe ToTest',
                revocation_endpoint: 'revocation_endpoint ToTest',
                introspection_endpoint: 'introspection_endpoint ToTest',
            };

            const mappedWellKnownEndpoints = {
                issuer: returnedWellKnownEndpoints.issuer,
                jwksUri: returnedWellKnownEndpoints.jwks_uri,
                authorizationEndpoint: returnedWellKnownEndpoints.authorization_endpoint,
                tokenEndpoint: returnedWellKnownEndpoints.token_endpoint,
                userinfoEndpoint: returnedWellKnownEndpoints.userinfo_endpoint,
                endSessionEndpoint: returnedWellKnownEndpoints.end_session_endpoint,
                checkSessionIframe: returnedWellKnownEndpoints.check_session_iframe,
                revocationEndpoint: returnedWellKnownEndpoints.revocation_endpoint,
                introspectionEndpoint: returnedWellKnownEndpoints.introspection_endpoint,
            };

            spyOn(oidcConfigService as any, 'getWellKnownDocument').and.callFake(() => {
                return of(mappedWellKnownEndpoints);
            });

            const eventSpy = spyOn(eventsService, 'fireEvent');

            oidcConfigService.withConfig(config).then((result) => {
                expect(eventSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, { passedConfig: config, mappedWellKnownEndpoints: result });
            });
        }));

        it('Calls configurationProvider.setconfig with correct params', async(() => {
            const config = {
                stsServer: 'mySTSServer',
            };

            const returnedWellKnownEndpoints = {
                issuer: 'isserToTest',
                jwks_uri: 'jwks_uri ToTest',
                authorization_endpoint: 'authorization_endpoint ToTest',
                token_endpoint: 'token_endpoint ToTest',
                userinfo_endpoint: 'userinfo_endpointToTest',
                end_session_endpoint: 'end_session_endpoint ToTest',
                check_session_iframe: 'check_session_iframe ToTest',
                revocation_endpoint: 'revocation_endpoint ToTest',
                introspection_endpoint: 'introspection_endpoint ToTest',
            };

            const mappedWellKnownEndpoints = {
                issuer: returnedWellKnownEndpoints.issuer,
                jwksUri: returnedWellKnownEndpoints.jwks_uri,
                authorizationEndpoint: returnedWellKnownEndpoints.authorization_endpoint,
                tokenEndpoint: returnedWellKnownEndpoints.token_endpoint,
                userinfoEndpoint: returnedWellKnownEndpoints.userinfo_endpoint,
                endSessionEndpoint: returnedWellKnownEndpoints.end_session_endpoint,
                checkSessionIframe: returnedWellKnownEndpoints.check_session_iframe,
                revocationEndpoint: returnedWellKnownEndpoints.revocation_endpoint,
                introspectionEndpoint: returnedWellKnownEndpoints.introspection_endpoint,
            };

            spyOn(oidcConfigService as any, 'getWellKnownDocument').and.callFake(() => {
                return of(mappedWellKnownEndpoints);
            });

            const configSpy = spyOn(configurationProvider, 'setConfig');

            oidcConfigService.withConfig(config).then((result) => {
                expect(configSpy).toHaveBeenCalledWith(config, result);
            });
        }));
    });

    describe('getWellKnownDocument', () => {
        it('should add suffix if it does not exist on current url', () => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });

            const urlWithoutSuffix = 'myUrl';
            const urlWithSuffix = `${urlWithoutSuffix}/.well-known/openid-configuration`;
            (oidcConfigService as any).getWellKnownDocument(urlWithoutSuffix);
            expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        });

        it('should not add suffix if it does exist on current url', () => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });

            const urlWithSuffix = `myUrl/.well-known/openid-configuration`;
            (oidcConfigService as any).getWellKnownDocument(urlWithSuffix);
            expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        });

        it('should not add suffix if it does exist in the middle of current url', () => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });

            const urlWithSuffix = `myUrl/.well-known/openid-configuration/and/some/more/stuff`;
            (oidcConfigService as any).getWellKnownDocument(urlWithSuffix);
            expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        });
    });
});
