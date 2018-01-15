import { TestLogging } from '../common/test-logging.service';
import { LoggerService } from '../../src/services/oidc.logger.service';
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
    OidcSecurityStorage,
    AuthConfiguration
} from './../../index';

import { OidcConfigService } from '../../src/services/oidc.security.config.service';

describe('AuthWellKnownEndpoints', () => {
    let authWellKnownEndpoints: any;
    let httpMock: HttpTestingController;
    let authConfiguration: AuthConfiguration;
    let loggerService: LoggerService;
	let oidcConfigService: OidcConfigService;

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
                OidcDataService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage
                },
                {
                    provide: LoggerService,
                    useClass: TestLogging
                }
            ]
        });
    });

    beforeEach(() => {
        authWellKnownEndpoints = TestBed.get(AuthWellKnownEndpoints);
        oidcConfigService = TestBed.get(OidcConfigService);
        httpMock = TestBed.get(HttpTestingController);
        authConfiguration = TestBed.get(AuthConfiguration);
        loggerService = TestBed.get(LoggerService);
    });

    it('can create', () => {
        expect(authWellKnownEndpoints).toBeDefined();
        expect(oidcConfigService).toBeDefined();
        expect(httpMock).toBeDefined();
        expect(authConfiguration).toBeDefined();
    });

    it('if wellKnownEndpoints are set logdebug is called two times', () => {
        spyOnProperty(
            oidcConfigService,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue({ issuer: 'anyValue' });

        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
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
            oidcConfigService,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue({ issuer: 'anyValue' });

        spyOn(authWellKnownEndpoints.onWellKnownEndpointsLoaded, 'emit');

        authWellKnownEndpoints.setupModule();

        expect(
            authWellKnownEndpoints.onWellKnownEndpointsLoaded.emit
        ).toHaveBeenCalled();
    });

    it('if wellKnownEndpoints are set authWellKnownEndpoints applied all values correctly', () => {
        spyOnProperty(
            oidcConfigService,
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
            oidcConfigService,
            'wellKnownEndpoints',
            'get'
        ).and.returnValue('');

        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
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

        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
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

});
