// TODO fix @Fabian
//import { StateValidationService } from '../../src/services/oidc-security-state-validation.service';
//import { HttpClientModule } from '@angular/common/http';
//import { TestBed } from '@angular/core/testing';
//import { BrowserModule } from '@angular/platform-browser';
//import { RouterTestingModule } from '@angular/router/testing';

//import { AuthModule } from './../../index';
//import { OidcSecurityValidation } from '../../src/services/oidc.security.validation';
//import { JwtKeys } from '../../src/models/jwtkeys';
//import { OidcSecurityCommon } from '../../src/services/oidc.security.common';

//describe('OidcSecurityService', () => {
//    let stateValidationService: StateValidationService;
//    let oidcSecurityValidation: OidcSecurityValidation;
//    let oidcSecurityCommon: OidcSecurityCommon;

//    beforeEach(() => {
//        TestBed.configureTestingModule({
//            imports: [
//                BrowserModule,
//                HttpClientModule,
//                RouterTestingModule,
//                AuthModule.forRoot()
//            ],
//            providers: [StateValidationService]
//        });
//    });

//    beforeEach(() => {
//        stateValidationService = TestBed.get(StateValidationService);
//        oidcSecurityValidation = TestBed.get(OidcSecurityValidation);
//        oidcSecurityCommon = TestBed.get(OidcSecurityCommon);
//    });

//    it('should create', () => {
//        expect(stateValidationService).toBeTruthy();
//        expect(oidcSecurityValidation).toBeTruthy();
//    });

//    it('should return invalid result if validateStateFromHashCallback is false ', () => {
//        const oidcSecurityValidationSpy = spyOn(
//            oidcSecurityValidation,
//            'validateStateFromHashCallback'
//        ).and.returnValue(false);

//        const oidcSecurityCommonSpy = spyOn(
//            oidcSecurityCommon,
//            'logWarning'
//        ).and.returnValue(false);

//        stateValidationService.validateState('', new JwtKeys());

//        expect(oidcSecurityCommonSpy.calls.any()).toBe(
//            true,
//            'oidcSecurityCommonSpy logWarning called'
//        );

//        expect(oidcSecurityValidationSpy.calls.any()).toBe(
//            true,
//            'validateStateFromHashCallback called'
//        );
//    });
//});
