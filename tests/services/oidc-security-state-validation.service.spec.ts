import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import {} from 'jasmine';
import {
    AuthConfiguration,
    OidcSecurityStorage,
    OidcSecurityValidation,
} from '../../src/angular-auth-oidc-client';
import { AuthWellKnownEndpoints } from '../../src/models/auth.well-known-endpoints';
import { JwtKeys } from '../../src/models/jwtkeys';
import { OpenIDImplicitFlowConfiguration } from '../../src/modules/auth.configuration';
import { AuthModule } from '../../src/modules/auth.module';
import { StateValidationService } from '../../src/services/oidc-security-state-validation.service';
import { TokenHelperService } from '../../src/services/oidc-token-helper.service';
import { LoggerService } from '../../src/services/oidc.logger.service';
import { TestLogging } from '../common/test-logging.service';
import { TestStorage } from '../common/test-storage.service';

describe('OidcSecurityStateValidationService', () => {
    let stateValidationService: StateValidationService;
    let oidcSecurityValidation: OidcSecurityValidation;
    let authConfiguration: AuthConfiguration;
    let tokenHelperService: TokenHelperService;
    let loggerService: LoggerService;

    const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();

    openIDImplicitFlowConfiguration.stsServer = 'https://localhost:44363';
    openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44363';
    // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
    // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
    openIDImplicitFlowConfiguration.client_id = 'singleapp';
    openIDImplicitFlowConfiguration.response_type = 'id_token token';
    openIDImplicitFlowConfiguration.scope = 'dataEventRecords openid';
    openIDImplicitFlowConfiguration.post_logout_redirect_uri =
        'https://localhost:44363/Unauthorized';
    openIDImplicitFlowConfiguration.start_checksession = false;
    openIDImplicitFlowConfiguration.silent_renew = true;
    openIDImplicitFlowConfiguration.silent_renew_url =
        'https://localhost:44363/silent-renew.html';
    openIDImplicitFlowConfiguration.post_login_route = '/dataeventrecords';
    // HTTP 403
    openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
    // HTTP 401
    openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
    openIDImplicitFlowConfiguration.log_console_warning_active = true;
    openIDImplicitFlowConfiguration.log_console_debug_active = true;
    // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
    // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
    openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;

    const authWellKnownEndpoints = new AuthWellKnownEndpoints();
    authWellKnownEndpoints.issuer = 'https://localhost:44363';
    authWellKnownEndpoints.jwks_uri =
        'https://localhost:44363/.well-known/openid-configuration/jwks';
    authWellKnownEndpoints.authorization_endpoint =
        'https://localhost:44363/connect/authorize';
    authWellKnownEndpoints.token_endpoint =
        'https://localhost:44363/connect/token';
    authWellKnownEndpoints.userinfo_endpoint =
        'https://localhost:44363/connect/userinfo';
    authWellKnownEndpoints.end_session_endpoint =
        'https://localhost:44363/connect/endsession';
    authWellKnownEndpoints.check_session_iframe =
        'https://localhost:44363/connect/checksession';
    authWellKnownEndpoints.revocation_endpoint =
        'https://localhost:44363/connect/revocation';
    authWellKnownEndpoints.introspection_endpoint =
        'https://localhost:44363/connect/introspect';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                HttpClientModule,
                RouterTestingModule,
                AuthModule.forRoot(),
            ],
            providers: [
                StateValidationService,
                OidcSecurityValidation,
                AuthConfiguration,
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
        authConfiguration = TestBed.get(AuthConfiguration);
        tokenHelperService = TestBed.get(TokenHelperService);
        loggerService = TestBed.get(LoggerService);

        stateValidationService.setupModule(authWellKnownEndpoints);
    });

    it('should create', () => {
        expect(stateValidationService).toBeTruthy();
        expect(oidcSecurityValidation).toBeTruthy();
        expect(authConfiguration).toBeTruthy();
    });

    it('should return invalid result if validateStateFromHashCallback is false', () => {
        spyOn(
            oidcSecurityValidation,
            'validateStateFromHashCallback'
        ).and.returnValue(false);

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

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

        let logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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

        let logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(
            () => {}
        );

        const state = stateValidationService.validateState(
            {
                access_token: 'access_tokenTEST',
                id_token: 'id_tokenTEST',
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
