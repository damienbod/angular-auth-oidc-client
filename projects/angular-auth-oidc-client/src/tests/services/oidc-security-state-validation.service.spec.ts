import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../../lib/auth.module';
import { ConfigurationProvider } from '../../lib/config';
import { AuthWellKnownEndpoints } from '../../lib/config/auth-well-known-endpoints';
import { OpenIdConfiguration } from '../../lib/config/openid-configuration';
import { JwtKeys } from '../../lib/models/jwtkeys';
import { ValidationResult } from '../../lib/models/validation-result.enum';
import { StateValidationService } from '../../lib/services/oidc-security-state-validation.service';
import { TokenHelperService } from '../../lib/services/oidc-token-helper.service';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { OidcSecurityValidation } from '../../lib/services/oidc.security.validation';
import { OidcSecurityStorage } from '../../lib/storage/oidc.security.storage';
import { TestLogging } from '../common/test-logging.service';
import { TestStorage } from '../common/test-storage.service';

describe('OidcSecurityStateValidationService', () => {
    let stateValidationService: StateValidationService;
    let oidcSecurityValidation: OidcSecurityValidation;
    let tokenHelperService: TokenHelperService;
    let loggerService: LoggerService;
    let configProvider: ConfigurationProvider;
    let config: OpenIdConfiguration;
    let authWellKnownEndpoints: AuthWellKnownEndpoints;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                StateValidationService,
                OidcSecurityValidation,
                ConfigurationProvider,
                LoggerService,
                TokenHelperService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage,
                },
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
            ],
        });
    });

    beforeEach(() => {
        stateValidationService = TestBed.inject(StateValidationService);
        oidcSecurityValidation = TestBed.inject(OidcSecurityValidation);
        configProvider = TestBed.inject(ConfigurationProvider);
        tokenHelperService = TestBed.inject(TokenHelperService);
        loggerService = TestBed.inject(LoggerService);
    });

    beforeEach(() => {
        config = {
            stsServer: 'https://localhost:44363',
            redirectUrl: 'https://localhost:44363',
            clientId: 'singleapp',
            responseType: 'id_token token',
            scope: 'dataEventRecords openid',
            postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
            startCheckSession: false,
            silentRenew: true,
            silentRenewUrl: 'https://localhost:44363/silent-renew.html',
            postLoginRoute: '/dataeventrecords',
            forbiddenRoute: '/Forbidden',
            unauthorizedRoute: '/Unauthorized',
            logConsoleWarningActive: true,
            logConsoleDebugActive: true,
            maxIdTokenIatOffsetAllowedInSeconds: 10,
        };

        authWellKnownEndpoints = {
            issuer: 'https://localhost:44363',
            jwksUri: 'https://localhost:44363/well-known/openid-configuration/jwks',
            authorizationEndpoint: 'https://localhost:44363/connect/authorize',
            tokenEndpoint: 'https://localhost:44363/connect/token',
            userinfoEndpoint: 'https://localhost:44363/connect/userinfo',
            endSessionEndpoint: 'https://localhost:44363/connect/endsession',
            checkSessionIframe: 'https://localhost:44363/connect/checksession',
            revocationEndpoint: 'https://localhost:44363/connect/revocation',
            introspectionEndpoint: 'https://localhost:44363/connect/introspect',
        };
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(configProvider).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false', () => {
        configProvider.setConfig(config, authWellKnownEndpoints);
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState('', new JwtKeys());

        expect(oidcSecurityValidation.validateStateFromHashCallback).toHaveBeenCalled();

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect state');

        expect(state.accessToken).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decodedIdToken).toBeDefined();
        expect(state.idToken).toBe('');
    });

    it('access_token should equal result.access_token and is valid if response_type is "id_token token"', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;

        config.clientId = '';

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAtHash').and.returnValue(true);

        config.autoCleanStateAfterAuthentication = false;

        configProvider.setConfig(config, authWellKnownEndpoints);

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        console.log('state', state);
        expect(state.authResponseIsValid).toBe(true);
    });

    it('should return invalid result if validateSignatureIdToken is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        config.responseType = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);
        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Signature validation failed id_token');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenNonce is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        config.responseType = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect nonce');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateRequiredIdToken is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);
        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenIatMaxOffset is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(false);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        configProvider.setConfig(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith(
            'authorizedCallback Validation, iat rejected id_token was issued too far away from the current time'
        );

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenIss is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenAud is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(false);

        config.clientId = '';
        configProvider.setConfig(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect aud');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenExpNotExpired is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);

        config.clientId = '';
        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback token expired');

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('Reponse is valid if authConfiguration.response_type does not equal "id_token token"', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);
        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);
        config.clientId = '';
        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(true);
        config.responseType = 'NOT id_token token';
        config.autoCleanStateAfterAuthentication = false;
        configProvider.setConfig(config, authWellKnownEndpoints);

        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('AuthorizedCallback token(s) validated, continue');

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.accessToken).toBe('');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });

    it('Reponse is invalid if validateIdTokenAtHash is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);
        config.maxIdTokenIatOffsetAllowedInSeconds = 0;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);
        config.clientId = '';
        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(true);
        config.responseType = 'id_token token';
        config.autoCleanStateAfterAuthentication = false;
        spyOn(oidcSecurityValidation, 'validateIdTokenAtHash').and.returnValue(false);
        configProvider.setConfig(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect at_hash');

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('id_tokenTEST');
        expect(state.decodedIdToken).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return valid result if validateIdTokenIss is false and iss_validation_off is true', () => {
        config.issValidationOff = true;
        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(false);

        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validateIdTokenAtHash').and.returnValue(true);
        config.responseType = 'id_token token';
        configProvider.setConfig(config, authWellKnownEndpoints);

        const logDebugSpy = spyOn(loggerService, 'logDebug'); // .and.callFake(() => {});

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('iss validation is turned off, this is not recommended!');

        expect(state.state).toBe(ValidationResult.Ok);
        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.authResponseIsValid).toBe(true);
        expect(state.decodedIdToken).toBeDefined();
        expect(state.idToken).toBe('id_tokenTEST');
    });

    it('should return valid if there is no id_token', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.responseType = 'code';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenNonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateRequiredIdToken').and.returnValue(true);

        config.maxIdTokenIatOffsetAllowedInSeconds = 0;

        config.clientId = '';

        spyOn(oidcSecurityValidation, 'validateIdTokenIatMaxOffset').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAud').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenExpNotExpired').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validateIdTokenAtHash').and.returnValue(true);

        config.autoCleanStateAfterAuthentication = false;

        configProvider.setConfig(config, authWellKnownEndpoints);

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: '',
            },
            new JwtKeys()
        );

        expect(state.accessToken).toBe('access_tokenTEST');
        expect(state.idToken).toBe('');
        expect(state.decodedIdToken).toBeDefined();
        console.log('state', state);
        expect(state.authResponseIsValid).toBe(true);
    });
});
