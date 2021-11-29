/* eslint-disable max-len */
import { TestBed } from '@angular/core/testing';
import { AuthWellKnownEndpoints } from '../config/auth-well-known/auth-well-known-endpoints';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LogLevel } from '../logging/log-level';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { EqualityService } from '../utils/equality/equality.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { StateValidationService } from './state-validation.service';
import { TokenValidationService } from './token-validation.service';
import { TokenValidationServiceMock } from './token-validation.service-mock';
import { ValidationResult } from './validation-result';

describe('State Validation Service', () => {
  let stateValidationService: StateValidationService;
  let oidcSecurityValidation: TokenValidationService;
  let tokenHelperService: TokenHelperService;
  let loggerService: LoggerService;
  let config: OpenIdConfiguration;
  let authWellKnownEndpoints: AuthWellKnownEndpoints;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        StateValidationService,
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        {
          provide: TokenValidationService,
          useClass: TokenValidationServiceMock,
        },
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        TokenHelperService,
        EqualityService,
        FlowHelper,
      ],
    });
  });

  beforeEach(() => {
    stateValidationService = TestBed.inject(StateValidationService);
    oidcSecurityValidation = TestBed.inject(TokenValidationService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    loggerService = TestBed.inject(LoggerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  beforeEach(() => {
    config = {
      authority: 'https://localhost:44363',
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
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
    };

    authWellKnownEndpoints = {
      issuer: 'https://localhost:44363',
      jwksUri: 'https://localhost:44363/well-known/openid-configuration/jwks',
      authorizationEndpoint: 'https://localhost:44363/connect/authorize',
      tokenEndpoint: 'https://localhost:44363/connect/token',
      userInfoEndpoint: 'https://localhost:44363/connect/userinfo',
      endSessionEndpoint: 'https://localhost:44363/connect/endsession',
      checkSessionIframe: 'https://localhost:44363/connect/checksession',
      revocationEndpoint: 'https://localhost:44363/connect/revocation',
      introspectionEndpoint: 'https://localhost:44363/connect/introspect',
    };
  });

  it('should create', () => {
    expect(stateValidationService).toBeTruthy();
    expect(oidcSecurityValidation).toBeTruthy();
  });

  it('should return invalid result if validateStateFromHashCallback is false', () => {
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(oidcSecurityValidation.validateStateFromHashCallback).toHaveBeenCalled();

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback incorrect state');

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

    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(state.accessToken).toBe('access_tokenTEST');
    expect(state.idToken).toBe('id_tokenTEST');
    expect(state.decodedIdToken).toBe('decoded_id_token');
    expect(state.authResponseIsValid).toBe(true);
  });

  it('should return invalid result if validateSignatureIdToken is false', () => {
    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);
    config.responseType = 'id_token token';
    spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue('decoded_id_token');
    spyOn(oidcSecurityValidation, 'validateSignatureIdToken').and.returnValue(false);
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    const state = stateValidationService.validateState(callbackContext, config);

    expect(logDebugSpy).toHaveBeenCalledWith(config, 'authCallback Signature validation failed id_token');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback incorrect nonce, did you call the checkAuth() method multiple times?');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');
    const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logDebugSpy).toHaveBeenCalledWith(config, 'authCallback Validation, one of the REQUIRED properties missing from id_token');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');
    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(
      config,
      'authCallback Validation, iat rejected id_token was issued too far away from the current time'
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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');
    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback incorrect iss does not match authWellKnownEndpoints issuer');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');
    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback incorrect aud');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.getValidatedStateResult(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback id token expired');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const logDebugSpy = spyOn(loggerService, 'logDebug').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    const state = stateValidationService.validateState(callbackContext, config);

    expect(logDebugSpy).toHaveBeenCalledWith(config, 'authCallback token(s) validated, continue');

    // CAN THIS BE DONE VIA IF/ELSE IN THE BEGINNING?
    expect(state.accessToken).toBe('');
    expect(state.idToken).toBe('id_tokenTEST');
    expect(state.decodedIdToken).toBe('decoded_id_token');
    expect(state.authResponseIsValid).toBe(true);
  });

  it('Response is invalid if validateIdTokenAtHash is false', () => {
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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const logWarningSpy = spyOn(loggerService, 'logWarning').and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logWarningSpy).toHaveBeenCalledWith(config, 'authCallback incorrect at_hash');

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
    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const logDebugSpy = spyOn(loggerService, 'logDebug'); // .and.callFake(() => {});

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: 'id_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(logDebugSpy).toHaveBeenCalledWith(config, 'iss validation is turned off, this is not recommended!');

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

    const readSpy = spyOn(storagePersistenceService, 'read');
    readSpy.withArgs('authWellKnownEndPoints', config).and.returnValue(authWellKnownEndpoints);
    readSpy.withArgs('authStateControl', config).and.returnValue('authStateControl');
    readSpy.withArgs('authNonce', config).and.returnValue('authNonce');

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsdfhhhhsdf',
      sessionState: 'fdffsggggggdfsdf',
      authResult: {
        access_token: 'access_tokenTEST',
        id_token: '',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
    const state = stateValidationService.validateState(callbackContext, config);

    expect(state.accessToken).toBe('access_tokenTEST');
    expect(state.idToken).toBe('');
    expect(state.decodedIdToken).toBeDefined();
    expect(state.authResponseIsValid).toBe(true);
  });

  it('validate refresh good ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: true,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206486,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(true);
  });

  it('validate refresh invalid iss ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: true,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.ch/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206486,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(false);
  });

  it('validate refresh invalid sub ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: true,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f7',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206486,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(false);
  });

  it('validate refresh invalid auth_time ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: false,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206488,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(false);
  });

  it('validate refresh good full', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: false,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206486,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(true);
  });

  it('validate refresh good no existing id_token', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: false,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: null,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206486,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(true);
  });

  it('validate refresh invalid aud ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: false,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'bad',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206488,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(false);
  });

  it('validate refresh invalid azp ', () => {
    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJpc3MiOiJodHRwczovL2RhbWllbmJvZC5iMmNsb2dpbi5jb20vYTA5NThmNDUtMTk1Yi00MDM2LTkyNTktZGUyZjdlNTk0ZGI2L3YyLjAvIiwiZXhwIjoxNTg5MjEwMDg2LCJuYmYiOjE1ODkyMDY0ODYsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsIm5hbWUiOiJkYW1pZW5ib2QiLCJlbWFpbHMiOlsiZGFtaWVuQGRhbWllbmJvZC5vbm1pY3Jvc29mdC5jb20iXSwidGZwIjoiQjJDXzFfYjJjcG9saWN5ZGFtaWVuIiwibm9uY2UiOiIwMDdjNDE1M2I2YTA1MTdjMGU0OTc0NzZmYjI0OTk0OGVjNWNsT3ZRUSIsInNjcCI6ImRlbW8ucmVhZCIsImF6cCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsInZlciI6IjEuMCIsImlhdCI6MTU4OTIwNjQ4Nn0.Zyg8GAsyj8_ljdheJ57oQ8ldZMon4nLs1VCkBnIon2cXGrXlTA_fYP_Ypf5x5OZcCg-wXdo9RttsLRD69v1cnd5eUc9crzkJ18BruRdhoVQdlrGuakwKujozY2-EU8KNH64qSDpPOqQ9m4jdzGAOkY0wWitOlvYoNZHDzDS4ZIWn8W5H2nwAbf8LMAdXqy41YaIBF4lo3ZaKoUKQqCwIG_0aLvRQcmiwkEoQ5-EUb_hdOejTIbIT5PryyqMnvJYgyrKTf1VY060YpETH19PMosNriwPrPesJhsruphqzaJexg0Pt09ILoMHJhebkON-oPjXLjDOGLfnRTPp6oP_Drg';
    const idToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
    const refreshTokenData =
      'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ..Gn8_Hs0IAsJm7Tlw.4dvuowpuUHz2RifIINXM5mBbiOorKgAWZapLdohY9LYd4yxAr-K2E8PFCi_lmbTfY0nxXkRqL9S_JnJKP_2Sd_R0g3PC5weu9XxGIT-oWATtkVX4KDWlAsN0-xWUosulT4LEbFygC3bA6B5Ch2BgN_zZ5L-aJjwE1JkE55tQCDgT2tS6uRQjvh1U3ddWgYEsmCqbWQnwbMPPkxA-PvXXTtUKqXTzAo0T9tLBXrSaXurq0Y-visy036Sy9Y7f-duiTLMJ8WKw_XYz3uzsj7Y0SV2A3m2rJNs3HjPBRUOyyWpdhmjo3VAes1bc8nZuZHsP4S2HSe7hRoOxYkWfGhIBvI8FT3dBZKfttAT64fsR-fQtQ4ia0z12SsLoCJhF1VRf3NU1-Lc2raP0kvN7HOGQFuVPkjmWOqKKoy4at7PAvC_sWHOND7QkmYkFyfQvGcNmt_lA10VZlr_cOeuiNCTPUHZHi-pv7nsefxVoPYGJPztGvIJ_daAUigXMZGARTTIhCt84PzPEdPMlCSI3GuNxQoD95rhvSyZP8SBQ5NIs_qwxYMAfzXgJP8aFK-ZHd8ZQfm1Rg79mO0LH1GcQzIhc4pC4PsvcSm6I6Jo1ZeEw5pRQQWf59asPyORG-2qfnMvZB1hGCZU7J78lAcse6sXCtBlQDLe9Th5Goibn.XdCGzjyrmgKzJktSPSDH0g';

    const configRefresh = {
      authority: 'https://localhost:44363',
      redirectUrl: 'https://localhost:44363',
      clientId: 'singleapp',
      responseType: 'icode',
      scope: 'dataEventRecords openid',
      postLogoutRedirectUri: 'https://localhost:44363/Unauthorized',
      startCheckSession: false,
      silentRenew: true,
      silentRenewUrl: 'https://localhost:44363/silent-renew.html',
      postLoginRoute: '/dataeventrecords',
      forbiddenRoute: '/Forbidden',
      unauthorizedRoute: '/Unauthorized',
      logLevel: LogLevel.Debug,
      maxIdTokenIatOffsetAllowedInSeconds: 10,
      useRefreshToken: true,
      ignoreNonceAfterRefresh: true,
      disableRefreshIdTokenAuthTimeValidation: false,
      enableIdTokenExpiredValidationInRenew: true,
    };

    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: refreshTokenData,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: idToken,
      authResult: {
        access_token: accessToken,
        id_token: idToken,
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const decodedIdToken = {
      exp: 1589210086,
      nbf: 1589206486,
      ver: '1.0',
      iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
      aud: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
      nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
      iat: 1589206486,
      auth_time: 1589206488,
      name: 'damienbod',
      emails: ['damien@damienbod.onmicrosoft.com'],
      tfp: 'B2C_1_b2cpolicydamien',
      at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
      azp: 'no bad',
    };
    const isValid = (stateValidationService as any).isIdTokenAfterRefreshTokenRequestValid(callbackContext, decodedIdToken, configRefresh);

    expect(isValid).toBe(false);
  });

  it('should return invalid context error', () => {
    spyOn(oidcSecurityValidation, 'validateStateFromHashCallback').and.returnValue(true);

    config.responseType = 'id_token token';

    config.maxIdTokenIatOffsetAllowedInSeconds = 0;
    spyOn(oidcSecurityValidation, 'validateIdTokenIss').and.returnValue(false);

    const callbackContext = {
      code: 'fdffsdfsdf',
      refreshToken: null,
      state: 'fdffsggggggdfsdf',
      sessionState: 'fdffsggggggdfsdf',
      existingIdToken: null,
      authResult: {
        error: 'access_tokenTEST',
      },
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
    };

    const isValid = stateValidationService.getValidatedStateResult(callbackContext, config);

    expect(isValid.authResponseIsValid).toBe(false);
  });

  it('should return authResponseIsValid false when null is passed', () => {
    const isValid = stateValidationService.getValidatedStateResult(null, config);

    expect(isValid.authResponseIsValid).toBe(false);
  });
});
