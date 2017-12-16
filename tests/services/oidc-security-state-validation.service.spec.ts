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

describe('OidcSecurityService', () => {
    let stateValidationService: StateValidationService;
    let oidcSecurityValidation: OidcSecurityValidation;
    let oidcSecurityCommon: OidcSecurityCommon;
    let authConfiguration: AuthConfiguration;

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
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(oidcSecurityCommon).toBeTruthy();
        expect(authConfiguration).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false ', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(false);

        spyOn(oidcSecurityCommon, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState('', new JwtKeys());

        expect(
            oidcSecurityValidation.validateStateFromHashCallback
        ).toHaveBeenCalled();
        expect(state.access_token).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('');
    });

    it('access_token should equal result.access_token if response_type is "id_token token"', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(true);

        spyOnProperty(
            authConfiguration,
            'response_type',
            'get'
        ).and.returnValue('id_token token');

        spyOn(oidcSecurityValidation, 'getPayloadFromToken').and.returnValue(
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
        expect(state.authResponseIsValid).toBe(true);
    });
});
