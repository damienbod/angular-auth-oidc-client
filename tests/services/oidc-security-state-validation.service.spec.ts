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
    OidcSecurityStorage
} from '../../src/angular-auth-oidc-client';
import { OidcSecurityCommon } from '../../src/services/oidc.security.common';

import {} from 'jasmine';
import {} from 'node';

describe('OidcSecurityService', () => {
    let stateValidationService: StateValidationService;
    let oidcSecurityValidation: OidcSecurityValidation;
    let oidcSecurityCommon: OidcSecurityCommon;

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
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(oidcSecurityCommon).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false ', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(false);

        spyOn(oidcSecurityCommon, 'logWarning').and.callFake(() => {
            console.log('spyOn(oidcSecurityCommon');
        });

        const state = stateValidationService.validateState('', new JwtKeys());

        expect(
            oidcSecurityValidation.validateStateFromHashCallback
        ).toHaveBeenCalled();
        expect(state.access_token).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('');
    });
});
