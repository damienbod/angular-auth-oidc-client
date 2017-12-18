"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var oidc_data_service_1 = require("../../src/services/oidc-data.service");
var testing_1 = require("@angular/common/http/testing");
var testing_2 = require("@angular/core/testing");
var platform_browser_1 = require("@angular/platform-browser");
var testing_3 = require("@angular/router/testing");
var of_1 = require("rxjs/observable/of");
var test_storage_service_1 = require("../common/test-storage.service");
var index_1 = require("./../../index");
describe('AuthWellKnownEndpoints', function () {
    var authWellKnownEndpoints;
    var oidcSecurityCommon;
    var httpMock;
    var authConfiguration;
    beforeEach(function () {
        testing_2.TestBed.configureTestingModule({
            imports: [
                platform_browser_1.BrowserModule,
                testing_1.HttpClientTestingModule,
                testing_3.RouterTestingModule,
                index_1.AuthModule.forRoot()
            ],
            providers: [
                index_1.AuthWellKnownEndpoints,
                index_1.AuthConfiguration,
                index_1.OidcSecurityCommon,
                oidc_data_service_1.OidcDataService,
                {
                    provide: index_1.OidcSecurityStorage,
                    useClass: test_storage_service_1.TestStorage
                }
            ]
        });
    });
    beforeEach(function () {
        authWellKnownEndpoints = testing_2.TestBed.get(index_1.AuthWellKnownEndpoints);
        oidcSecurityCommon = testing_2.TestBed.get(index_1.OidcSecurityCommon);
        httpMock = testing_2.TestBed.get(testing_1.HttpTestingController);
        authConfiguration = testing_2.TestBed.get(index_1.AuthConfiguration);
    });
    it('can create', function () {
        expect(authWellKnownEndpoints).toBeDefined();
        expect(oidcSecurityCommon).toBeDefined();
        expect(httpMock).toBeDefined();
        expect(authConfiguration).toBeDefined();
    });
    it('if wellKnownEndpoints are set logdebug is called two times', function () {
        spyOnProperty(oidcSecurityCommon, 'wellKnownEndpoints', 'get').and.returnValue({ issuer: 'anyValue' });
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        authWellKnownEndpoints.setupModule();
        expect(logDebugSpy).toHaveBeenCalledTimes(2);
        expect(logDebugSpy).toHaveBeenCalledWith({ issuer: 'anyValue' });
        expect(logDebugSpy).toHaveBeenCalledWith('AuthWellKnownEndpoints already defined');
    });
    it('if wellKnownEndpoints are set emit was firing once', function () {
        spyOnProperty(oidcSecurityCommon, 'wellKnownEndpoints', 'get').and.returnValue({ issuer: 'anyValue' });
        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        spyOn(authWellKnownEndpoints.onWellKnownEndpointsLoaded, 'emit');
        authWellKnownEndpoints.setupModule();
        expect(authWellKnownEndpoints.onWellKnownEndpointsLoaded.emit).toHaveBeenCalled();
    });
    it('if wellKnownEndpoints are set authWellKnownEndpoints applied all values correctly', function () {
        spyOnProperty(oidcSecurityCommon, 'wellKnownEndpoints', 'get').and.returnValue({
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
        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        authWellKnownEndpoints.setupModule();
        expect(authWellKnownEndpoints.issuer).toBe('anyValue');
        expect(authWellKnownEndpoints.authorization_endpoint).toBe('authorization_endpoint');
        expect(authWellKnownEndpoints.jwks_uri).toBe('jwks_uri');
        expect(authWellKnownEndpoints.token_endpoint).toBe('token_endpoint');
        expect(authWellKnownEndpoints.userinfo_endpoint).toBe('userinfo_endpoint');
        expect(authWellKnownEndpoints.end_session_endpoint).toBe('end_session_endpoint');
        expect(authWellKnownEndpoints.check_session_iframe).toBe('check_session_iframe');
        expect(authWellKnownEndpoints.revocation_endpoint).toBe('revocation_endpoint');
        expect(authWellKnownEndpoints.introspection_endpoint).toBe('introspection_endpoint');
    });
    it('if wellKnownEndpoints are not set logdebug is called once and values are set correctly', function () {
        var testValues = {
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
        spyOnProperty(oidcSecurityCommon, 'wellKnownEndpoints', 'get').and.returnValue('');
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(function () {
            return of_1.of(testValues);
        });
        authWellKnownEndpoints.setupModule();
        expect(logDebugSpy).toHaveBeenCalledWith('AuthWellKnownEndpoints first time, get from the server');
        expect(authWellKnownEndpoints.issuer).toBe('anyValue');
        expect(authWellKnownEndpoints.authorization_endpoint).toBe('authorization_endpoint');
        expect(authWellKnownEndpoints.jwks_uri).toBe('jwks_uri');
        expect(authWellKnownEndpoints.token_endpoint).toBe('token_endpoint');
        expect(authWellKnownEndpoints.userinfo_endpoint).toBe('userinfo_endpoint');
        expect(authWellKnownEndpoints.end_session_endpoint).toBe('end_session_endpoint');
        expect(authWellKnownEndpoints.check_session_iframe).toBe('check_session_iframe');
        expect(authWellKnownEndpoints.revocation_endpoint).toBe('revocation_endpoint');
        expect(authWellKnownEndpoints.introspection_endpoint).toBe('introspection_endpoint');
    });
    it('if wellKnownEndpoints are not set oidcSecurityCommon.wellKnownEndpoints equal the returned data', function () {
        var testValues = {
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
        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(function () {
            return of_1.of(testValues);
        });
        authWellKnownEndpoints.setupModule();
        expect(oidcSecurityCommon.wellKnownEndpoints).toBe(testValues);
    });
    it('if wellKnownEndpoints are not set logdebug is called with the data', function () {
        var testValues = {
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
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(function () {
            return of_1.of(testValues);
        });
        authWellKnownEndpoints.setupModule();
        expect(logDebugSpy).toHaveBeenCalledWith(testValues);
    });
    it('if wellKnownEndpoints are not set onWellKnownEndpointsLoaded.emit() is called', function () {
        var testValues = {
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
        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        spyOn(authWellKnownEndpoints, 'getWellKnownEndpoints').and.callFake(function () {
            return of_1.of(testValues);
        });
        spyOn(authWellKnownEndpoints.onWellKnownEndpointsLoaded, 'emit');
        authWellKnownEndpoints.setupModule();
        expect(authWellKnownEndpoints.onWellKnownEndpointsLoaded.emit).toHaveBeenCalled();
    });
    it('if override_well_known_configuration is not set url stays same', function () {
        spyOnProperty(authConfiguration, 'stsServer', 'get').and.returnValue('hallelujah');
        spyOnProperty(authConfiguration, 'override_well_known_configuration', 'get').and.returnValue(false);
        authWellKnownEndpoints
            .getWellKnownEndpoints()
            .subscribe(function (data) {
            expect(data.name).toBe('Luke Skywalker');
        });
        var req = httpMock.expectOne("hallelujah/.well-known/openid-configuration", 'call to api');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        expect(req.request.url).toBe("hallelujah/.well-known/openid-configuration");
        req.flush({
            name: 'Luke Skywalker'
        });
        httpMock.verify();
    });
    it('if override_well_known_configuration is set to true the url changes', function () {
        spyOnProperty(authConfiguration, 'stsServer', 'get').and.returnValue('hallelujah');
        spyOnProperty(authConfiguration, 'override_well_known_configuration', 'get').and.returnValue(true);
        spyOnProperty(authConfiguration, 'override_well_known_configuration_url', 'get').and.returnValue('OVERRIDE THE WHOLE URL!!!!');
        authWellKnownEndpoints
            .getWellKnownEndpoints()
            .subscribe(function (data) {
            expect(data.name).toBe('Luke Skywalker');
        });
        var req = httpMock.expectOne("OVERRIDE THE WHOLE URL!!!!", 'call to api');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        expect(req.request.url).toBe("OVERRIDE THE WHOLE URL!!!!");
        req.flush({
            name: 'Luke Skywalker'
        });
        httpMock.verify();
    });
});
//# sourceMappingURL=auth-well-known-endpoints.spec.js.map