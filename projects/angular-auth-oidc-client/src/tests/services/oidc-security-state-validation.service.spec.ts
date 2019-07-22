import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { OpenIdConfiguration } from '../../lib/models/auth.configuration';
import { AuthWellKnownEndpoints } from '../../lib/models/auth.well-known-endpoints';
import { JwtKeys } from '../../lib/models/jwtkeys';
import { ValidationResult } from '../../lib/models/validation-result.enum';
import { AuthModule } from '../../lib/modules/auth.module';
import { ConfigurationProvider } from '../../lib/services/auth-configuration.provider';
import { StateValidationService } from '../../lib/services/oidc-security-state-validation.service';
import { TokenHelperService } from '../../lib/services/oidc-token-helper.service';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { OidcSecurityStorage } from '../../lib/services/oidc.security.storage';
import { OidcSecurityValidation } from '../../lib/services/oidc.security.validation';
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
        stateValidationService = TestBed.get(StateValidationService);
        oidcSecurityValidation = TestBed.get(OidcSecurityValidation);
        configProvider = TestBed.get(ConfigurationProvider);
        tokenHelperService = TestBed.get(TokenHelperService);
        loggerService = TestBed.get(LoggerService);
    });

    beforeEach(() => {
        config = {
            stsServer: 'https://localhost:44363',
            redirect_url: 'https://localhost:44363',
            client_id: 'singleapp',
            response_type: 'id_token token',
            scope: 'dataEventRecords openid',
            post_logout_redirect_uri: 'https://localhost:44363/Unauthorized',
            start_checksession: false,
            silent_renew: true,
            silent_renew_url: 'https://localhost:44363/silent-renew.html',
            post_login_route: '/dataeventrecords',
            forbidden_route: '/Forbidden',
            unauthorized_route: '/Unauthorized',
            log_console_warning_active: true,
            log_console_debug_active: true,
            max_id_token_iat_offset_allowed_in_seconds: 10,
        };

        authWellKnownEndpoints = {
            issuer: 'https://localhost:44363',
            jwks_uri: 'https://localhost:44363/well-known/openid-configuration/jwks',
            authorization_endpoint: 'https://localhost:44363/connect/authorize',
            token_endpoint: 'https://localhost:44363/connect/token',
            userinfo_endpoint: 'https://localhost:44363/connect/userinfo',
            end_session_endpoint: 'https://localhost:44363/connect/endsession',
            check_session_iframe: 'https://localhost:44363/connect/checksession',
            revocation_endpoint: 'https://localhost:44363/connect/revocation',
            introspection_endpoint: 'https://localhost:44363/connect/introspect',
        };
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(configProvider).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState('', new JwtKeys());

        expect(oidcSecurityValidation.validateStateFromHashCallback).toHaveBeenCalled();

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect state');

        expect(state.access_token).toBe('');
        expect(state.authResponseIsValid).toBe(false);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('');
    });

    it('access_token should equal result.access_token and is valid if response_type is "id_token token"', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;

        config.client_id = '';

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(true);

        config.auto_clean_state_after_authentication = false;

        configProvider.setup(config, authWellKnownEndpoints);

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        console.log('state', state);
        expect(state.authResponseIsValid).toBe(true);
    });

    it('should return invalid result if validate_signature_id_token is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        config.response_type = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);
        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Signature validation failed id_token');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_nonce is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        config.response_type = 'id_token token';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect nonce');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_required_id_token is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);
        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_iat_max_offset is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(false);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        configProvider.setup(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

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

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_iss is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_aud is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(false);

        config.client_id = '';
        configProvider.setup(config, authWellKnownEndpoints);
        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect aud');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validate_id_token_exp_not_expired is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'id_token token';

        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);

        config.client_id = '';
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback token expired');

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('Reponse is valid if authConfiguration.response_type does not equal "id_token token"', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        config.client_id = '';
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        config.response_type = 'NOT id_token token';
        config.auto_clean_state_after_authentication = false;
        configProvider.setup(config, authWellKnownEndpoints);

        const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logDebugSpy).toHaveBeenCalledWith('AuthorizedCallback token(s) validated, continue');

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(true);
    });

    it('Reponse is invalid if validate_id_token_at_hash is false', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        config.max_id_token_iat_offset_allowed_in_seconds = 0;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        config.client_id = '';
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        config.response_type = 'id_token token';
        config.auto_clean_state_after_authentication = false;
        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(false);
        configProvider.setup(config, authWellKnownEndpoints);

        const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => { });

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
            },
            new JwtKeys()
        );

        expect(logWarningSpy).toHaveBeenCalledWith('authorizedCallback incorrect at_hash');

        // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('id_tokenTEST');
        expect(state.decoded_id_token).toBe('decoded_id_token');
        expect(state.authResponseIsValid).toBe(false);
    });

    it('should return valid result if validate_id_token_iss is false and iss_validation_off is true', () => {
        config.iss_validation_off = true;
        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(false);

        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);
        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(true);
        config.response_type = 'id_token token';
        configProvider.setup(config, authWellKnownEndpoints);

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
        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.authResponseIsValid).toBe(true);
        expect(state.decoded_id_token).toBeDefined();
        expect(state.id_token).toBe('id_tokenTEST');
    });

    it('should return valid if there is no id_token', () => {
        spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

        config.response_type = 'code';
        spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');

        spyOn(oidcSecurityValidation, 'validate_signature_id_token').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_nonce').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_required_id_token').and.returnValue(true);

        config.max_id_token_iat_offset_allowed_in_seconds = 0;

        config.client_id = '';

        spyOn(oidcSecurityValidation, 'validate_id_token_iat_max_offset').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_aud').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_exp_not_expired').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_iss').and.returnValue(true);

        spyOn(oidcSecurityValidation, 'validate_id_token_at_hash').and.returnValue(true);

        config.auto_clean_state_after_authentication = false;

        configProvider.setup(config, authWellKnownEndpoints);

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: '',
            },
            new JwtKeys()
        );

        expect(state.access_token).toBe('access_tokenTEST');
        expect(state.id_token).toBe('');
        expect(state.decoded_id_token).toBeDefined();
        console.log('state', state);
        expect(state.authResponseIsValid).toBe(true);
    });
});
