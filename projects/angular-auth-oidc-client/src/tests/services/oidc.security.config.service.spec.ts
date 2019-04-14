import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { AuthModule } from '../../lib/modules/auth.module';
import { OidcConfigService } from '../../lib/services/oidc.security.config.service';

describe('OidcConfigService', () => {
    let oidcConfigService: OidcConfigService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, AuthModule.forRoot()],
            providers: [OidcConfigService],
        });
    });

    beforeEach(() => {
        oidcConfigService = TestBed.get(OidcConfigService);
        httpMock = TestBed.get(HttpTestingController);
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

            const spy = spyOn(console, 'error');
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
                customAuthWellknownEndpoints: authWellKnownEndPoints,
                customConfig: returnedClientConfig,
            };

            const spy = spyOn((oidcConfigService as any).configurationLoadedInternal, 'next');

            oidcConfigService.load(configUrl).then(result => {
                expect(result).toBe(true);
            });

            oidcConfigService.onConfigurationLoaded.subscribe(result => {
                expect(spy).toHaveBeenCalledWith(expectedResult);
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
            const returnedClientConfig = {
                stsServer: '',
            };

            const spy = spyOn(console, 'error');
            const expectedErrorMessage = `Property 'stsServer' is not present of passed config ${JSON.stringify(returnedClientConfig)}`;

            oidcConfigService.load_using_stsServer(configUrl).then(result => {
                expect(result).toBe(false);
                expect(spy).toHaveBeenCalledWith(expectedErrorMessage, returnedClientConfig);
            });

            const req = httpMock.expectOne(configUrl);
            expect(req.request.method).toBe('GET');
            req.flush(returnedClientConfig);
        }));
    });
});
