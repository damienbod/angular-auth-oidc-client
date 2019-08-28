import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { AuthModule } from '../../lib/modules/auth.module';
import { OidcConfigService } from '../../lib/services/oidc.security.config.service';
import { LoggerService } from '../../lib/angular-auth-oidc-client';
import { TestLogging } from '../common/test-logging.service';

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
        oidcConfigService = TestBed.get(OidcConfigService);
        httpMock = TestBed.get(HttpTestingController);
        loggerService = TestBed.get(LoggerService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it(`Service should be present`, () => {
        expect(oidcConfigService).toBeDefined();
    });

    describe(`method 'load' tests`, () => {
        it(`should call error message when loaded with URL and no property 'stsServer' is on the response`, async(() => {
            const configUrl = 'any/config/url';
            const returnedClientConfig = {
                notStsServer: 'anyvalue',
            };

            const spy = spyOn(loggerService, 'logError');
            const expectedErrorMessage = `Property 'stsServer' is not present of passed config ${JSON.stringify(returnedClientConfig)}`;

            oidcConfigService.load(configUrl).then(result => {
                expect(result).toBe(false);
                expect(spy).toHaveBeenCalledWith(expectedErrorMessage, returnedClientConfig);
            });

            const req = httpMock.expectOne(configUrl);
            expect(req.request.method).toBe('GET');
            req.flush(returnedClientConfig);
        }));

        it(`should have correct response when called and response has the 'stsServer' property`, async(() => {
            const configUrl = 'any/config/url';
            const returnedClientConfig = {
                stsServer: 'myStsServerAdress',
            };

            const authWellKnownEndPoints = {
                authwellknown: 'endpoints',
            };

            const expectedResult = {
                authWellknownEndpoints: authWellKnownEndPoints,
                customConfig: returnedClientConfig,
            };

            const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();

            oidcConfigService.load(configUrl).then(result => {
                expect(result).toBe(true);
                expect(spy).toHaveBeenCalledWith(expectedResult);
            });

            oidcConfigService.onConfigurationLoaded.subscribe(result => {
                expect(result).toEqual(expectedResult);
            });

            const req = httpMock.expectOne(configUrl);
            expect(req.request.method).toBe('GET');
            req.flush(returnedClientConfig);

            const url = `${returnedClientConfig.stsServer}/.well-known/openid-configuration`;

            const secondReq = httpMock.expectOne(url);
            secondReq.flush(authWellKnownEndPoints);
        }));
    });

    describe(`method 'load_using_stsServer' tests`, () => {
        it(`should call error message when called with empty string`, async(() => {
            const configUrl = '';

            expect(() => {
                oidcConfigService.load_using_stsServer(configUrl);
            }).toThrowError();
        }));

        it(`should have correct response when passing the correc 'stsServer' property`, async(() => {
            const stsServer = 'myStsServerAdress';

            const authWellKnownEndPoints = {
                authwellknown: 'endpoints',
            };

            const expectedResult = {
                authWellknownEndpoints: authWellKnownEndPoints,
                customConfig: { stsServer },
            };

            const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();

            oidcConfigService.load_using_stsServer(stsServer).then(result => {
                expect(result).toBe(true);
                expect(spy).toHaveBeenCalledWith(expectedResult);
            });

            oidcConfigService.onConfigurationLoaded.subscribe(result => {
                expect(result).toEqual(expectedResult);
            });

            const url = `myStsServerAdress/.well-known/openid-configuration`;
            const req = httpMock.expectOne(url);
            expect(req.request.method).toBe('GET');
            req.flush(authWellKnownEndPoints);
        }));
    });

    describe(`method 'load_using_custom_stsServer' tests`, () => {
        it(`should have correct response when passing the correct 'stsServer' property`, async(() => {
            const stsServer = 'myCompleteStsServerAdress';

            const authWellKnownEndPoints = {
                authwellknown: 'endpoints',
            };

            const expectedResult = {
                authWellknownEndpoints: authWellKnownEndPoints,
                customConfig: { stsServer },
            };

            const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next').and.callThrough();

            oidcConfigService.load_using_custom_stsServer(stsServer).then(result => {
                expect(result).toBe(true);
                expect(spy).toHaveBeenCalledWith(expectedResult);
            });

            oidcConfigService.onConfigurationLoaded.subscribe(result => {
                expect(result).toEqual(expectedResult);
            });

            const url = `myCompleteStsServerAdress`;
            const req = httpMock.expectOne(url);
            expect(req.request.method).toBe('GET');
            req.flush(authWellKnownEndPoints);
        }));
    });
});
