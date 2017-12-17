import { OidcDataService } from '../../src/services/oidc-data.service';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs/observable/of';

import { TestStorage } from '../common/test-storage.service';
import {
    AuthModule,
    AuthWellKnownEndpoints,
    OidcSecurityCommon,
    OidcSecurityStorage,
    AuthConfiguration
} from './../../index';

describe('AuthWellKnownEndpoints', () => {
    let authWellKnownEndpoints: any;
    let oidcSecurityCommon: OidcSecurityCommon;
    let httpMock: HttpTestingController;
    let authConfiguration: AuthConfiguration;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                HttpClientTestingModule,
                RouterTestingModule,
                AuthModule.forRoot()
            ],
            providers: [
                AuthWellKnownEndpoints,
                AuthConfiguration,
                OidcSecurityCommon,
                OidcDataService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage
                }
            ]
        });
    });

    beforeEach(() => {
        authWellKnownEndpoints = TestBed.get(AuthWellKnownEndpoints);
        oidcSecurityCommon = TestBed.get(OidcSecurityCommon);
        httpMock = TestBed.get(HttpTestingController);
        authConfiguration = TestBed.get(AuthConfiguration);
    });

    it('can create', () => {
        expect(authWellKnownEndpoints).toBeDefined();
        expect(oidcSecurityCommon).toBeDefined();
        expect(httpMock).toBeDefined();
        expect(authConfiguration).toBeDefined();
    });

    it('if wellKnownEndpoints are set logdebug is called two times', () => {
        spyOnProperty(
            oidcSecurityCommon,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue({ issuer: 'anyValue' });

        const logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        authWellKnownEndpoints.setupModule();

        expect(logDebugSpy).toHaveBeenCalledTimes(2);
        expect(logDebugSpy).toHaveBeenCalledWith({ issuer: 'anyValue' });
        expect(logDebugSpy).toHaveBeenCalledWith(
            'AuthWellKnownEndpoints already defined'
        );
    });

    it('if wellKnownEndpoints are set emit was firing once', () => {
        spyOnProperty(
            oidcSecurityCommon,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue({ issuer: 'anyValue' });

        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(() => {});

        spyOn(authWellKnownEndpoints.onWellKnownEndpointsLoaded, 'emit');

        authWellKnownEndpoints.setupModule();

        expect(
            authWellKnownEndpoints.onWellKnownEndpointsLoaded.emit
        ).toHaveBeenCalled();
    });

    it('if wellKnownEndpoints are set authWellKnownEndpoints applied all values correctly', () => {
        spyOnProperty(
            oidcSecurityCommon,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue({
            issuer: 'anyValue',
            authorization_endpoint: 'authorization_endpoint',
            jwks_uri: 'jwks_uri',
            token_endpoint: 'token_endpoint',
            userinfo_endpoint: 'userinfo_endpoint',
            end_session_endpoint: 'end_session_endpoint',
            check_session_iframe: 'check_session_iframe',
            revocation_endpoint: 'revocation_endpoint',
            introspection_endpoint: 'introspection_endpoint'
        });

        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(() => {});

        authWellKnownEndpoints.setupModule();

        expect(authWellKnownEndpoints.issuer).toBe('anyValue');
        expect(authWellKnownEndpoints.authorization_endpoint).toBe(
            'authorization_endpoint'
        );

        expect(authWellKnownEndpoints.jwks_uri).toBe('jwks_uri');
        expect(authWellKnownEndpoints.token_endpoint).toBe('token_endpoint');
        expect(authWellKnownEndpoints.userinfo_endpoint).toBe(
            'userinfo_endpoint'
        );
        expect(authWellKnownEndpoints.end_session_endpoint).toBe(
            'end_session_endpoint'
        );
        expect(authWellKnownEndpoints.check_session_iframe).toBe(
            'check_session_iframe'
        );
        expect(authWellKnownEndpoints.revocation_endpoint).toBe(
            'revocation_endpoint'
        );
        expect(authWellKnownEndpoints.introspection_endpoint).toBe(
            'introspection_endpoint'
        );
    });

    it('if wellKnownEndpoints are not set logdebug is called once and values are set correctly', () => {
        const testValues = {
            issuer: 'anyValue',
            authorization_endpoint: 'authorization_endpoint',
            jwks_uri: 'jwks_uri',
            token_endpoint: 'token_endpoint',
            userinfo_endpoint: 'userinfo_endpoint',
            end_session_endpoint: 'end_session_endpoint',
            check_session_iframe: 'check_session_iframe',
            revocation_endpoint: 'revocation_endpoint',
            introspection_endpoint: 'introspection_endpoint'
        };

        spyOnProperty(
            oidcSecurityCommon,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue('');

        const logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(
            () => {
                return of(testValues);
            }
        );

        authWellKnownEndpoints.setupModule();

        expect(logDebugSpy).toHaveBeenCalledWith(
            'AuthWellKnownEndpoints first time, get from the server'
        );

        expect(authWellKnownEndpoints.issuer).toBe('anyValue');
        expect(authWellKnownEndpoints.authorization_endpoint).toBe(
            'authorization_endpoint'
        );

        expect(authWellKnownEndpoints.jwks_uri).toBe('jwks_uri');
        expect(authWellKnownEndpoints.token_endpoint).toBe('token_endpoint');
        expect(authWellKnownEndpoints.userinfo_endpoint).toBe(
            'userinfo_endpoint'
        );
        expect(authWellKnownEndpoints.end_session_endpoint).toBe(
            'end_session_endpoint'
        );
        expect(authWellKnownEndpoints.check_session_iframe).toBe(
            'check_session_iframe'
        );
        expect(authWellKnownEndpoints.revocation_endpoint).toBe(
            'revocation_endpoint'
        );
        expect(authWellKnownEndpoints.introspection_endpoint).toBe(
            'introspection_endpoint'
        );
    });

    it('if wellKnownEndpoints are not set oidcSecurityCommon.wellKnownEndpoints equal the returned data', () => {
        const testValues = {
            issuer: 'anyValue',
            authorization_endpoint: 'authorization_endpoint',
            jwks_uri: 'jwks_uri',
            token_endpoint: 'token_endpoint',
            userinfo_endpoint: 'userinfo_endpoint',
            end_session_endpoint: 'end_session_endpoint',
            check_session_iframe: 'check_session_iframe',
            revocation_endpoint: 'revocation_endpoint',
            introspection_endpoint: 'introspection_endpoint'
        };

        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(() => {});

        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(
            () => {
                return of(testValues);
            }
        );

        authWellKnownEndpoints.setupModule();

        expect(oidcSecurityCommon.wellKnownEndpoints).toBe(testValues);
    });

    it('if wellKnownEndpoints are not set logdebug is called with the data', () => {
        const testValues = {
            issuer: 'anyValue',
            authorization_endpoint: 'authorization_endpoint',
            jwks_uri: 'jwks_uri',
            token_endpoint: 'token_endpoint',
            userinfo_endpoint: 'userinfo_endpoint',
            end_session_endpoint: 'end_session_endpoint',
            check_session_iframe: 'check_session_iframe',
            revocation_endpoint: 'revocation_endpoint',
            introspection_endpoint: 'introspection_endpoint'
        };

        const logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(
            () => {
                return of(testValues);
            }
        );

        authWellKnownEndpoints.setupModule();

        expect(logDebugSpy).toHaveBeenCalledWith(testValues);
    });

    it('if wellKnownEndpoints are not set onWellKnownEndpointsLoaded.emit() is called', () => {
        const testValues = {
            issuer: 'anyValue',
            authorization_endpoint: 'authorization_endpoint',
            jwks_uri: 'jwks_uri',
            token_endpoint: 'token_endpoint',
            userinfo_endpoint: 'userinfo_endpoint',
            end_session_endpoint: 'end_session_endpoint',
            check_session_iframe: 'check_session_iframe',
            revocation_endpoint: 'revocation_endpoint',
            introspection_endpoint: 'introspection_endpoint'
        };

        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(() => {});

        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(
            () => {
                return of(testValues);
            }
        );

        spyOn(authWellKnownEndpoints.onWellKnownEndpointsLoaded, 'emit');

        authWellKnownEndpoints.setupModule();

        expect(
            authWellKnownEndpoints.onWellKnownEndpointsLoaded.emit
        ).toHaveBeenCalled();
    });

    it('if override_well_known_configuration is not set url stays same', () => {
        spyOnProperty(authConfiguration, 'stsServer', 'get').and.returnValue(
            'hallelujah'
        );

        spyOnProperty(
            authConfiguration,
            'override_well_known_configuration',
            'get'
        ).and.returnValue(false);

        authWellKnownEndpoints
            .getWellKnownEndpoints()
            .subscribe((data: any) => {
                expect(data.name).toBe('Luke Skywalker');
            });

        const req = httpMock.expectOne(
            `hallelujah/.well-known/openid-configuration`,
            'call to api'
        );

        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        expect(req.request.url).toBe(
            `hallelujah/.well-known/openid-configuration`
        );

        req.flush({
            name: 'Luke Skywalker'
        });

        httpMock.verify();
    });

    it('if override_well_known_configuration is set to true the url changes', () => {
        spyOnProperty(authConfiguration, 'stsServer', 'get').and.returnValue(
            'hallelujah'
        );

        spyOnProperty(
            authConfiguration,
            'override_well_known_configuration',
            'get'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'override_well_known_configuration_url',
            'get'
        ).and.returnValue('OVERRIDE THE WHOLE URL!!!!');

        authWellKnownEndpoints
            .getWellKnownEndpoints()
            .subscribe((data: any) => {
                expect(data.name).toBe('Luke Skywalker');
            });

        const req = httpMock.expectOne(
            `OVERRIDE THE WHOLE URL!!!!`,
            'call to api'
        );

        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        expect(req.request.url).toBe(`OVERRIDE THE WHOLE URL!!!!`);

        req.flush({
            name: 'Luke Skywalker'
        });

        httpMock.verify();
    });
});
