import { StateValidationService } from '../../src/services/oidc-security-state-validation.service';
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../../src/modules/auth.module';
import { OidcSecurityValidation } from '../../src/angular-auth-oidc-client';
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
            providers: [StateValidationService]
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

    // it('should return invalid result if validateStateFromHashCallback is false ', () => {
    //     const oidcSecurityValidationSpy = spyOn(
    //         oidcSecurityValidation,
    //         'validateStateFromHashCallback'
    //     ).and.returnValue(false);

    //     const oidcSecurityCommonSpy = spyOn(
    //         oidcSecurityCommon,
    //         'logWarning'
    //     ).and.returnValue(false);

    //     stateValidationService.validateState('', new JwtKeys());

    //     expect(oidcSecurityCommonSpy.calls.any()).toBe(
    //         true,
    //         'oidcSecurityCommonSpy logWarning called'
    //     );

    //     expect(oidcSecurityValidationSpy.calls.any()).toBe(
    //         true,
    //         'validateStateFromHashCallback called'
    //     );
    // });
});
