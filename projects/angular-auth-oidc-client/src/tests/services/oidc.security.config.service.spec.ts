import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthModule, LoggerService, OidcConfigService } from '../../lib/angular-auth-oidc-client';
import { TestLogging } from '../../lib/logging/logger.service-mock';

describe('OidcConfigService', () => {
    let oidcConfigService: OidcConfigService;
    let httpMock: HttpTestingController;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, AuthModule.forRoot()],
            providers: [
                OidcConfigService,
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
            ],
        });
    });

    beforeEach(() => {
        oidcConfigService = TestBed.inject(OidcConfigService);
        httpMock = TestBed.inject(HttpTestingController);
        loggerService = TestBed.inject(LoggerService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it(`Service should be present`, () => {
        expect(oidcConfigService).toBeDefined();
    });

    describe(`method 'load' tests`, () => {
        //     it(`should call error message when loaded with URL and no property 'stsServer' is on the response`, async(() => {
        //         const configUrl = 'any/config/url';
        //         const returnedClientConfig = {
        //             notStsServer: 'anyvalue',
        //         };
        //         const spy = spyOn(loggerService, 'logError');
        //         const expectedErrorMessage = `Property 'stsServer' is not present of passed config
        // ${ JSON.stringify(returnedClientConfig) }`;
        //         oidcConfigService.load(configUrl).then((result) => {
        //             expect(result).toBe(false);
        //             expect(spy).toHaveBeenCalledWith(expectedErrorMessage, returnedClientConfig);
        //         });
        //         const req = httpMock.expectOne(configUrl);
        //         expect(req.request.method).toBe('GET');
        //         req.flush(returnedClientConfig);
        //     }));
        //     it(`should have correct response when called and response has the 'stsServer' property`, async(() => {
        //         const configUrl = 'any/config/url';
        //         const returnedClientConfig = {
        //             stsServer: 'myStsServerAdress',
        //         };
        //         const authWellKnownEndPoints = {
        //             authwellknown: 'endpoints',
        //         };
        //         const expectedResult = {
        //             authWellknownEndpoints: mapWellKnownEnpointProperties(authWellKnownEndPoints),
        //             customConfig: returnedClientConfig,
        //         };
        //         const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();
        //         oidcConfigService.load(configUrl).then((result) => {
        //             expect(result).toBe(true);
        //             expect(spy).toHaveBeenCalledWith(expectedResult);
        //         });
        //         oidcConfigService.onConfigurationLoaded.subscribe((result) => {
        //             expect(result).toEqual(expectedResult);
        //         });
        //         const req = httpMock.expectOne(configUrl);
        //         expect(req.request.method).toBe('GET');
        //         req.flush(returnedClientConfig);
        //         const url = `${returnedClientConfig.stsServer}/.well-known/openid-configuration`;
        //         const secondReq = httpMock.expectOne(url);
        //         secondReq.flush(authWellKnownEndPoints);
        //     }));
        // });
        // describe(`method 'loadUsingStsServer' tests`, () => {
        //     it(`should call error message when called with empty string`, async(() => {
        //         const configUrl = '';
        //         expect(() => {
        //             oidcConfigService.loadUsingStsServer(configUrl);
        //         }).toThrowError();
        //     }));
        //     it(`should have correct response when passing the correc 'stsServer' property`, async(() => {
        //         const stsServer = 'myStsServerAdress';
        //         const authWellknownEndpoints = {
        //             authwellknown: 'endpoints',
        //         };
        //         const expectedResult = {
        //             authWellknownEndpoints: mapWellKnownEnpointProperties(authWellknownEndpoints),
        //             customConfig: { stsServer },
        //         };
        //         const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();
        //         oidcConfigService.loadUsingStsServer(stsServer).then((result) => {
        //             expect(result).toBe(true);
        //             expect(spy).toHaveBeenCalledWith(expectedResult);
        //         });
        //         oidcConfigService.onConfigurationLoaded.subscribe((result) => {
        //             expect(result).toEqual(expectedResult);
        //         });
        //         const url = `myStsServerAdress/.well-known/openid-configuration`;
        //         const req = httpMock.expectOne(url);
        //         expect(req.request.method).toBe('GET');
        //         req.flush(authWellknownEndpoints);
        //     }));
        // });
        // describe(`method 'loadUsingCustomStsServer' tests`, () => {
        //     it(`should have correct response when passing the correct 'stsServer' property`, async(() => {
        //         const stsServer = 'myCompleteStsServerAdress';
        //         const authWellKnownEndPoints = {
        //             authwellknown: 'endpoints',
        //         };
        //         const expectedResult = {
        //             authWellknownEndpoints: mapWellKnownEnpointProperties(authWellKnownEndPoints),
        //             customConfig: { stsServer },
        //         };
        //         const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();
        //         oidcConfigService.loadUsingCustomStsServer(stsServer).then((result) => {
        //             expect(result).toBe(true);
        //             expect(spy).toHaveBeenCalledWith(expectedResult);
        //         });
        //         oidcConfigService.onConfigurationLoaded.subscribe((result) => {
        //             expect(result).toEqual(expectedResult);
        //         });
        //         const url = `myCompleteStsServerAdress`;
        //         const req = httpMock.expectOne(url);
        //         expect(req.request.method).toBe('GET');
        //         req.flush(authWellKnownEndPoints);
        //     }));
        // });
        // function mapWellKnownEnpointProperties(wellKnownEndpoints: any): AuthWellKnownEndpoints {
        //     return {
        //         issuer: wellKnownEndpoints.issuer,
        //         jwksUri: wellKnownEndpoints.jwks_uri,
        //         authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
        //         tokenEndpoint: wellKnownEndpoints.token_endpoint,
        //         userinfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
        //         endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
        //         checkSessionIframe: wellKnownEndpoints.check_session_iframe,
        //         revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
        //         introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
        //         // wellKnownEndpoints.device_authorization_endpoint,
        //     };
        // }
    });
});
