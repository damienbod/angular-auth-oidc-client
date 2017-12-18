"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var test_storage_service_1 = require("../common/test-storage.service");
var jwtkeys_1 = require("../../src/models/jwtkeys");
var oidc_security_state_validation_service_1 = require("../../src/services/oidc-security-state-validation.service");
var http_1 = require("@angular/common/http");
var testing_1 = require("@angular/core/testing");
var platform_browser_1 = require("@angular/platform-browser");
var testing_2 = require("@angular/router/testing");
var auth_module_1 = require("../../src/modules/auth.module");
var angular_auth_oidc_client_1 = require("../../src/angular-auth-oidc-client");
var oidc_security_common_1 = require("../../src/services/oidc.security.common");
var oidc_token_helper_service_1 = require("../../src/services/oidc-token-helper.service");
describe('OidcSecurityStateValidationService', function () {
    var stateValidationService;
    var oidcSecurityValidation;
    var oidcSecurityCommon;
    var authConfiguration;
    var tokenHelperService;
    beforeEach(function () {
        testing_1.TestBed.configureTestingModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule,
                testing_2.RouterTestingModule,
                auth_module_1.AuthModule.forRoot()
            ],
            providers: [
                oidc_security_state_validation_service_1.StateValidationService,
                angular_auth_oidc_client_1.OidcSecurityValidation,
                oidc_security_common_1.OidcSecurityCommon,
                angular_auth_oidc_client_1.AuthConfiguration,
                oidc_token_helper_service_1.TokenHelperService,
                {
                    provide: angular_auth_oidc_client_1.OidcSecurityStorage,
                    useClass: test_storage_service_1.TestStorage
                }
            ]
        });
    });
    beforeEach(function () {
        stateValidationService = testing_1.TestBed.get(oidc_security_state_validation_service_1.StateValidationService);
        oidcSecurityValidation = testing_1.TestBed.get(angular_auth_oidc_client_1.OidcSecurityValidation);
        oidcSecurityCommon = testing_1.TestBed.get(oidc_security_common_1.OidcSecurityCommon);
        authConfiguration = testing_1.TestBed.get(angular_auth_oidc_client_1.AuthConfiguration);
        tokenHelperService = testing_1.TestBed.get(oidc_token_helper_service_1.TokenHelperService);
    });
    it('should create', function () {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(oidcSecurityCommon).toBeTruthy();
        expect(authConfiguration).toBeTruthy();
    });
    it('should return invalid result if validateStateFromHashCallback is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState('', new jwtkeys_1.JwtKeys());
        expect(oidcSecurityValidation.validateStateFromHashCallback).toHaveBeenCalled();
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect state');
        expect(state.access_token).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('');
    });
    it('access_token should equal result.access_token and is valid if response_type is "id_token token"', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue('');
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(true);
        spyOnProperty(authConfiguration, 'auto_clean_state_after_authentication', 'get').and.returnValue('');
        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });
    it('should return invalid result if validate_signature_id_token is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(false);
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Signature validation failed id_token');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_id_token_nonce is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(false);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect nonce');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_required_id_token is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(false);
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_id_token_iat_max_offset is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(false);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback Validation, iat rejected id_token was issued too far away from the current time');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_id_token_iss is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(false);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_id_token_aud is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(false);
        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue('');
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect aud');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('should return invalid result if validate_id_token_exp_not_expired is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue('');
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(false);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback token expired');
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
    it('Reponse is valid if authConfiguration.response_type does not equal "id_token token"', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue('');
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('NOT id_token token');
        spyOnProperty(authConfiguration, 'auto_clean_state_after_authentication', 'get').and.returnValue('');
        var logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logDebugSpy).toHaveBeenCalledWith('AuthorizedCallback token(s) validated, continue');
        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });
    it('Reponse is invalid if validate_id_token_at_hash is false', function () {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOnProperty(authConfiguration, 'max_id_token_iat_offset_allowed_in_seconds', 'get').and.returnValue(0);
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue('');
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        spyOnProperty(authConfiguration, 'response_type', 'get').and.returnValue('id_token token');
        spyOnProperty(authConfiguration, 'auto_clean_state_after_authentication', 'get').and.returnValue('');
        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(false);
        var logWarningSpy = spyOn(oidcSecurityCommon, 'logWarning').and.callFake(function () { });
        var state = stateValidationService.validateState({
            access_token: 'access_tokenTEST',
            id_token: 'id_tokenTEST'
        }, new jwtkeys_1.JwtKeys());
        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect at_hash');
        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
});
//# sourceMappingURL=oidc-security-state-validation.service.spec.js.map