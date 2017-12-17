import { TestStorage } from '../common/test-storage.service';
import { JwtKeys } from '../../src/models/jwtkeys';
import { StateValidationService } from '../../src/services/oidc-security-state-validation.service';
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../../src/modules/auth.module';
import {
    OidcSecurityValidation,
    OidcSecurityStorage,
    AuthConfiguration
} from '../../src/angular-auth-oidc-client';
import { OidcSecurityCommon } from '../../src/services/oidc.security.common';

import {} from 'jasmine';
import {} from 'node';
import { TokenHelperService } from '../../src/services/oidc-token-helper.service';

describe('OidcSecurityStateValidationService', () => {
    let stateValidationService: StateValidationService;
    let oidcSecurityValidation: OidcSecurityValidation;
    let oidcSecurityCommon: OidcSecurityCommon;
    let authConfiguration: AuthConfiguration;
    let tokenHelperService: TokenHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                HttpClientModule,
                RouterTestingModule,
                AuthModule.forRoot()
            ],
            providers: [
                StateValidationService,
                OidcSecurityValidation,
                OidcSecurityCommon,
                AuthConfiguration,
                TokenHelperService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage
                }
            ]
        });
    });

    beforeEach(() => {
        stateValidationService = TestBed.get(StateValidationService);
        oidcSecurityValidation = TestBed.get(OidcSecurityValidation);
        oidcSecurityCommon = TestBed.get(OidcSecurityCommon);
        authConfiguration = TestBed.get(AuthConfiguration);
        tokenHelperService = TestBed.get(TokenHelperService);
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(oidcSecurityCommon).toBeTruthy();
        expect(authConfiguration).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(false);

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState('', new JwtKeys());

        expect(
            oidcSecurityValidation.validateStateFromHashCallback
        ).toHaveBeenCalled();

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback incorrect state'
        );

        expect(state.access_token).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('');
    });

    it('access_token should equal result.access_token and is valid if response_type is "id_token token"', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue(
            ''
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(
            true
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_exp_not_expired'
        ).and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            true
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_at_hash'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'auto_clean_state_after_authentication',
            'get'
        ).and.returnValue('');

        spyOn(oidcSecurityCommon, 'logDebug').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });

    it('should return invalid result if validate_signature_id_token is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(false);

        let logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith(
            'authorizedCallback Signature validation failed id_token'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_nonce is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(false);

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback incorrect nonce'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_required_id_token is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(false);

        let logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith(
            'authorizedCallback Validation, one of the REQUIRED properties missing from id_token'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_iat_max_offset is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(false);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback Validation, iat rejected id_token was issued too far away from the current time'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_iss is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            false
        );

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_aud is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            true
        );

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(
            false
        );

        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue(
            ''
        );

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback incorrect aud'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_exp_not_expired is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            true
        );

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(
            true
        );

        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue(
            ''
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_exp_not_expired'
        ).and.returnValue(false);

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback token expired'
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('Reponse is valid if authConfiguration.response_type does not equal "id_token token"', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            true
        );

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(
            true
        );

        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue(
            ''
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_exp_not_expired'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('NOT id_token token');

        spyOnProperty(
            authConfiguration,
            'auto_clean_state_after_authentication',
            'get'
        ).and.returnValue('');

        let logDebugSpy = spyOn(oidcSecurityCommon, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith(
            'AuthorizedCallback token(s) validated, continue'
        );

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });

    it('Reponse is invalid if validate_id_token_at_hash is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(
            'decoded_id_token'
        );

        spyOn(
            oidcSecurityValidation,
            'validate_signature_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_nonce'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_required_id_token'
        ).and.returnValue(true);

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_iat_max_offset'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'max_id_token_iat_offset_allowed_in_seconds',
            'get'
        ).and.returnValue(0);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(
            true
        );

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(
            true
        );

        spyOnProperty(authConfiguration, 'client_id', 'get').and.returnValue(
            ''
        );

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_exp_not_expired'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOnProperty(
            authConfiguration,
            'auto_clean_state_after_authentication',
            'get'
        ).and.returnValue('');

        spyOn(
            oidcSecurityValidation,
            'validate_id_token_at_hash'
        ).and.returnValue(false);

        let logWarningSpy = spyOn(
            oidcSecurityCommon,
            'logWarning'
        ).and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST'
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback incorrect at_hash'
        );

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });
});
