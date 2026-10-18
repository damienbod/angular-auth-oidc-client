import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { AuthWellKnownEndpoints } from '../config/auth-well-known/auth-well-known-endpoints';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { LogLevel } from '../logging/types/logging.types';
import { LoggerService } from '../logging/services/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { EqualityService } from '../utils/equality/equality.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { StateValidationResult } from './state-validation-result';
import { StateValidationService } from './state-validation.service';
import { TokenValidationService } from './token-validation.service';
import { ValidationResult } from './validation-result';

describe('State Validation Service', () => {
  let stateValidationService: StateValidationService;
  let tokenValidationService: TokenValidationService;
  let tokenHelperService: TokenHelperService;
  let loggerService: LoggerService;
  let config: OpenIdConfiguration;
  let authWellKnownEndpoints: AuthWellKnownEndpoints;
  let storagePersistenceService: StoragePersistenceService;
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(StoragePersistenceService),
        mockProvider(TokenValidationService),
        mockProvider(LoggerService),
        TokenHelperService,
        EqualityService,
        FlowHelper,
      ],
    });
  });

  beforeEach(() => {
    stateValidationService = TestBed.inject(StateValidationService);
    tokenValidationService = TestBed.inject(TokenValidationService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    loggerService = TestBed.inject(LoggerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    flowHelper = TestBed.inject(FlowHelper);
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
    expect(tokenValidationService).toBeTruthy();
  });

  describe('getValidatedStateResult id_token claims after a refresh', () => {
    const existingIdToken = 'existing_id_token';
    const newIdToken = 'new_id_token';
    let configRefresh: OpenIdConfiguration;
    let existingClaims: Record<string, unknown>;
    let logDebugSpy: ReturnType<typeof vi.spyOn>;

    function createClaims(): Record<string, unknown> {
      return {
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
    }

    function arrangeNewIdTokenClaims(newClaims: Record<string, unknown>): void {
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockImplementation(
        (token: any) => (token === existingIdToken ? existingClaims : newClaims)
      );
    }

    function createRefreshCallbackContext(
      existingToken: string | null = existingIdToken
    ): CallbackContext {
      return {
        code: '',
        refreshToken: 'refresh-token',
        state: '',
        sessionState: null,
        authResult: {
          access_token: 'access-token',
          id_token: newIdToken,
        },
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: existingToken,
      };
    }

    function getValidatedStateResult(
      callbackContext: CallbackContext = createRefreshCallbackContext()
    ): Promise<StateValidationResult> {
      return firstValueFrom(
        stateValidationService.getValidatedStateResult(
          callbackContext,
          configRefresh
        )
      );
    }

    beforeEach(() => {
      configRefresh = {
        ...config,
        responseType: 'code',
        useRefreshToken: true,
        ignoreNonceAfterRefresh: true,
        disableRefreshIdTokenAuthTimeValidation: false,
        triggerRefreshWhenIdTokenExpired: true,
      };
      existingClaims = createClaims();

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) =>
          args[0] === 'authWellKnownEndPoints'
            ? authWellKnownEndpoints
            : undefined
      );
      vi.spyOn(tokenHelperService, 'getHeaderFromToken').mockReturnValue({
        alg: 'RS256',
      });
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );
      logDebugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);
    });

    it('should be valid when the new id_token claims match the existing id_token and auth_time validation is disabled', async () => {
      configRefresh.disableRefreshIdTokenAuthTimeValidation = true;
      arrangeNewIdTokenClaims(createClaims());

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(true);
      expect(state.state).toBe(ValidationResult.Ok);
    });

    it('should be valid when all new id_token claims including auth_time match the existing id_token', async () => {
      arrangeNewIdTokenClaims(createClaims());

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(true);
      expect(state.state).toBe(ValidationResult.Ok);
    });

    it('should be valid when there is no existing id_token to compare with', async () => {
      arrangeNewIdTokenClaims({ ...createClaims(), iss: 'other-iss' });

      const state = await getValidatedStateResult(
        createRefreshCallbackContext(null)
      );

      expect(state.authResponseIsValid).toBe(true);
      expect(state.state).toBe(ValidationResult.Ok);
    });

    it('should not compare the claims when refresh tokens are not used', async () => {
      configRefresh.useRefreshToken = false;
      arrangeNewIdTokenClaims({ ...createClaims(), iss: 'other-iss' });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(true);
      expect(state.state).toBe(ValidationResult.Ok);
    });

    it('should be invalid when the iss of the new id_token differs', async () => {
      arrangeNewIdTokenClaims({
        ...createClaims(),
        iss: 'https://damienbod.b2clogin.ch/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
      });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        configRefresh,
        expect.stringContaining('iss do not match')
      );
    });

    it('should be invalid when the sub of the new id_token differs', async () => {
      arrangeNewIdTokenClaims({
        ...createClaims(),
        sub: 'f836f380-3c64-4802-8dbc-011981c068f7',
      });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        configRefresh,
        expect.stringContaining('sub do not match')
      );
    });

    it('should be invalid when the auth_time of the new id_token differs', async () => {
      arrangeNewIdTokenClaims({ ...createClaims(), auth_time: 1589206488 });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        configRefresh,
        expect.stringContaining('auth_time do not match')
      );
    });

    it('should be invalid when the aud of the new id_token differs', async () => {
      arrangeNewIdTokenClaims({ ...createClaims(), aud: 'bad' });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        configRefresh,
        expect.stringContaining('aud in new id_token is not valid')
      );
    });

    it('should be invalid when the new id_token has an azp the existing id_token does not have', async () => {
      arrangeNewIdTokenClaims({ ...createClaims(), azp: 'no bad' });

      const state = await getValidatedStateResult();

      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        configRefresh,
        expect.stringContaining('azp do not match')
      );
    });
  });

  describe('getValidatedStateResult', () => {
    it('should return authResponseIsValid false when an empty callback context is passed', async () => {
      const isValid = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          {} as CallbackContext,
          config
        )
      );

      expect(isValid.authResponseIsValid).toBe(false);
    });

    it('should return authResponseIsValid false when null is passed', async () => {
      const isValid = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          null as unknown as CallbackContext,
          config
        )
      );

      expect(isValid.authResponseIsValid).toBe(false);
    });

    it('should return invalid context error', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'id_token token';

      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        false
      );

      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const isValid = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(isValid.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenExpNotExpired is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'id_token token';

      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );

      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockReturnValue(
        false
      );
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );

      config.clientId = '';
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(false);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback id token expired'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateStateFromHashCallback is false', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            default:
              return undefined;
          }
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(false);

      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(
        tokenValidationService.validateStateFromHashCallback
      ).toHaveBeenCalled();

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect state'
      );
      expect(state.accessToken).toBe('');
      expect(state.authResponseIsValid).toBe(false);
      expect(state.decodedIdToken).toBeDefined();
      expect(state.idToken).toBe('');
    });

    it('should set the access_token and be valid if response_type is "id_token token"', async () => {
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockReturnValue(
        false
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );

      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      config.clientId = '';
      config.autoCleanStateAfterAuthentication = false;
      config.responseType = 'id_token token';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(true);
    });

    it('should return invalid result if validateSignatureIdToken is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(false));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            default:
              return undefined;
          }
        }
      );
      const logDebugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(vi.mocked(logDebugSpy).mock.calls).toEqual([
        [config, 'authCallback Signature validation failed id_token'],
        [config, 'authCallback token(s) invalid'],
      ]);

      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenNonce is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        false
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect nonce, did you call the checkAuth() method multiple times?'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateRequiredIdToken is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'id_token token';

      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );

      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));

      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );

      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(false);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logDebugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logDebugSpy).toHaveBeenCalledWith(
        config,
        'authCallback Validation, one of the REQUIRED properties missing from id_token'
      );
      expect(logDebugSpy).toHaveBeenCalledWith(
        config,
        'authCallback token(s) invalid'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenIatMaxOffset is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'id_token token';

      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(false);

      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback Validation, iat rejected id_token was issued too far away from the current time'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenIss is false and has authWellKnownEndPoints', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'id_token token';

      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );

      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));

      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );

      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);

      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);

      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        false
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect iss does not match authWellKnownEndpoints issuer'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenIss is false and has no authWellKnownEndPoints', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return null;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authWellKnownEndpoints is undefined'
      );

      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(ValidationResult.NoAuthWellKnownEndPoints);
    });

    it('should return invalid result if validateIdTokenAud is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        false
      );

      config.clientId = '';
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect aud'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return invalid result if validateIdTokenAzpExistsIfMoreThanOneAud is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(false);

      config.clientId = '';
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback missing azp'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(ValidationResult.IncorrectAzp);
    });

    it('should return invalid result if validateIdTokenAzpValid is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(false);

      config.clientId = '';
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect azp'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(ValidationResult.IncorrectAzp);
    });

    it('should return invalid result if the id_token claims after a refresh do not match the existing id_token', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockImplementation(
        (token: any) =>
          token === 'existing_id_token'
            ? { iss: 'other-iss' }
            : 'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
      config.useRefreshToken = true;

      config.clientId = '';
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
        state: 'fdffsdfhhhhsdf',
        sessionState: 'fdffsggggggdfsdf',
        authResult: {
          access_token: 'access_tokenTEST',
          id_token: 'id_tokenTEST',
        },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: 'existing_id_token',
      };
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback pre, post id_token claims do not match in refresh'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
      expect(state.state).toBe(
        ValidationResult.IncorrectIdTokenClaimsAfterRefresh
      );
    });

    it('should be valid if response_type does not equal "id_token token"', async () => {
      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockReturnValue(
        false
      );
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      config.clientId = '';
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      config.responseType = 'NOT id_token token';
      config.autoCleanStateAfterAuthentication = false;
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logDebugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logDebugSpy).toHaveBeenCalledWith(
        config,
        'authCallback token(s) validated, continue'
      );
      expect(logDebugSpy).not.toHaveBeenCalledWith(
        config,
        'authCallback token(s) invalid'
      );
      expect(state.accessToken).toBe('');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(true);
    });

    it('should be invalid if validateIdTokenAtHash is false', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      config.clientId = '';
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      config.responseType = 'id_token token';
      config.autoCleanStateAfterAuthentication = false;
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(false)
      );

      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockReturnValue(
        false
      );
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logWarningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(logWarningSpy).toHaveBeenCalledTimes(1);

      expect(logWarningSpy).toHaveBeenCalledWith(
        config,
        'authCallback incorrect at_hash'
      );
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('id_tokenTEST');
      expect(state.decodedIdToken).toBe('decoded_id_token');
      expect(state.authResponseIsValid).toBe(false);
    });

    it('should return valid result if validateIdTokenIss is false and iss_validation_off is true', async () => {
      config.issValidationOff = true;
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        false
      );

      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockReturnValue(
        false
      );
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );
      config.responseType = 'id_token token';
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const logDebugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined); // .and.callFake(() => undefined);
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(vi.mocked(logDebugSpy).mock.calls).toEqual([
        [config, 'iss validation is turned off, this is not recommended!'],
        [config, 'authCallback token(s) validated, continue'],
      ]);
      expect(state.state).toBe(ValidationResult.Ok);
      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.authResponseIsValid).toBe(true);
      expect(state.decodedIdToken).toBeDefined();
      expect(state.idToken).toBe('id_tokenTEST');
    });

    it('should return valid if there is no id_token', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      config.responseType = 'code';
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue(
        'decoded_id_token'
      );
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      config.clientId = '';
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAtHash').mockReturnValue(
        of(true)
      );

      config.autoCleanStateAfterAuthentication = false;

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'authStateControl';
            case 'authNonce':
              return 'authNonce';
            default:
              return undefined;
          }
        }
      );
      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
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
      const state = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(state.accessToken).toBe('access_tokenTEST');
      expect(state.idToken).toBe('');
      expect(state.decodedIdToken).toBeDefined();
      expect(state.authResponseIsValid).toBe(true);
    });

    it('should return OK if disableIdTokenValidation is true', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowImplicitFlowWithAccessToken'
      ).mockReturnValue(false);
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);

      config.responseType = 'id_token token';
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      config.disableIdTokenValidation = true;

      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: '',
        state: 'fdffsggggggdfsdf',
        sessionState: 'fdffsggggggdfsdf',
        existingIdToken: null,
        authResult: {},
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: null,
      };
      const isValid = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(isValid.state).toBe(ValidationResult.Ok);
      expect(isValid.authResponseIsValid).toBe(true);
    });

    it('should return OK if disableIdTokenValidation is false but inrefreshtokenflow and no id token is returned', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowImplicitFlowWithAccessToken'
      ).mockReturnValue(false);
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);

      config.responseType = 'id_token token';
      config.maxIdTokenIatOffsetAllowedInSeconds = 0;
      config.disableIdTokenValidation = false;

      const callbackContext = {
        code: 'fdffsdfsdf',
        refreshToken: 'something',
        state: 'fdffsggggggdfsdf',
        sessionState: 'fdffsggggggdfsdf',
        existingIdToken: null,
        authResult: {},
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
      };
      const isValid = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      expect(isValid.state).toBe(ValidationResult.Ok);
      expect(isValid.authResponseIsValid).toBe(true);
    });
  });
  describe('getValidatedStateResult in the refresh token flow', () => {
    // the storage is shared by all tabs, so another tab may have stored the
    // state and the nonce of its own login there
    beforeEach(() => {
      config.responseType = 'code';
      config.autoCleanStateAfterAuthentication = true;
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          switch (args[0]) {
            case 'authWellKnownEndPoints':
              return authWellKnownEndpoints;
            case 'authStateControl':
              return 'state-of-login-in-other-tab';
            case 'authNonce':
              return 'nonce-of-login-in-other-tab';
            default:
              return undefined;
          }
        }
      );
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue({});
      vi.spyOn(tokenHelperService, 'getHeaderFromToken').mockReturnValue({});
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenIss').mockReturnValue(
        true
      );
      vi.spyOn(tokenValidationService, 'validateIdTokenAud').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpExistsIfMoreThanOneAud'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenAzpValid'
      ).mockReturnValue(true);
    });

    function createRefreshCallbackContext(): CallbackContext {
      return {
        code: '',
        refreshToken: 'refresh-token',
        state: '',
        sessionState: null,
        authResult: {
          access_token: 'access-token',
          id_token: 'id-token',
          state: '',
        },
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      };
    }

    it('should not compare the state with the stored one', async () => {
      // Arrange
      const validateStateSpy = vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      );

      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );

      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createRefreshCallbackContext(),
          config
        )
      );

      // Assert
      expect(validateStateSpy).not.toHaveBeenCalled();
      expect(result.authResponseIsValid).toBe(true);
      expect(result.state).toBe(ValidationResult.Ok);
    });

    it('should validate the nonce against the refresh token placeholder instead of the stored nonce', async () => {
      // Arrange
      const validateNonceSpy = vi
        .spyOn(tokenValidationService, 'validateIdTokenNonce')
        .mockReturnValue(true);

      // Act
      await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createRefreshCallbackContext(),
          config
        )
      );

      // Assert
      expect(validateNonceSpy).toHaveBeenCalledExactlyOnceWith(
        {},
        TokenValidationService.refreshTokenNoncePlaceholder,
        false,
        config
      );
    });

    it('should not clear the stored state and nonce after a valid refresh', async () => {
      // Arrange
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');

      // Act
      await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createRefreshCallbackContext(),
          config
        )
      );

      // Assert
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should not clear the stored state and nonce after an invalid refresh', async () => {
      // Arrange
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        false
      );
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');
      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createRefreshCallbackContext(),
          config
        )
      );

      // Assert
      expect(result.state).toBe(ValidationResult.IncorrectNonce);
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should still clear the stored state and nonce after a valid code flow callback', async () => {
      // Arrange
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenIatMaxOffset'
      ).mockReturnValue(true);
      vi.spyOn(
        tokenValidationService,
        'validateIdTokenExpNotExpired'
      ).mockReturnValue(true);
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');
      const callbackContext = {
        ...createRefreshCallbackContext(),
        refreshToken: '',
        isRenewProcess: false,
      };
      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(callbackContext, config)
      );

      // Assert
      expect(result.authResponseIsValid).toBe(true);
      expect(result.state).toBe(ValidationResult.Ok);
      expect(writeSpy).toHaveBeenCalledWith('authNonce', null, config);
      expect(writeSpy).toHaveBeenCalledWith('authStateControl', '', config);
    });
  });

  describe('getValidatedStateResult defaults', () => {
    function createCodeFlowCallbackContext(
      authResult: CallbackContext['authResult']
    ): CallbackContext {
      return {
        code: 'code',
        refreshToken: '',
        state: 'state',
        sessionState: null,
        authResult,
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      };
    }

    beforeEach(() => {
      config.responseType = 'code';
    });

    it('should set an empty access token when the code flow response contains none', async () => {
      // Arrange
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      config.disableIdTokenValidation = true;

      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createCodeFlowCallbackContext({ state: 'state' }),
          config
        )
      );

      // Assert
      expect(result.accessToken).toBe('');
      expect(result.state).toBe(ValidationResult.Ok);
    });

    it('should use an iat max offset of 120 seconds when none is configured', async () => {
      // Arrange
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(tokenHelperService, 'getPayloadFromToken').mockReturnValue({});
      vi.spyOn(
        tokenValidationService,
        'validateSignatureIdToken'
      ).mockReturnValue(of(true));
      vi.spyOn(tokenValidationService, 'validateIdTokenNonce').mockReturnValue(
        true
      );
      vi.spyOn(
        tokenValidationService,
        'validateRequiredIdToken'
      ).mockReturnValue(true);
      const iatSpy = vi
        .spyOn(tokenValidationService, 'validateIdTokenIatMaxOffset')
        .mockReturnValue(false);

      delete config.maxIdTokenIatOffsetAllowedInSeconds;

      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createCodeFlowCallbackContext({
            access_token: 'access-token',
            id_token: 'id-token',
            state: 'state',
          }),
          config
        )
      );

      // Assert
      expect(iatSpy).toHaveBeenCalledExactlyOnceWith({}, 120, false, config);
      expect(result.state).toBe(ValidationResult.MaxOffsetExpired);
    });

    it('should clear the stored state when validation fails and autoCleanStateAfterAuthentication is true', async () => {
      // Arrange
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(false);
      config.autoCleanStateAfterAuthentication = true;
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');
      // Act
      const result = await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createCodeFlowCallbackContext({ state: 'state' }),
          config
        )
      );

      // Assert
      expect(result.state).toBe(ValidationResult.StatesDoNotMatch);
      expect(writeSpy).toHaveBeenCalledWith('authNonce', null, config);
      expect(writeSpy).toHaveBeenCalledWith('authStateControl', '', config);
    });

    it('should keep the stored state when validation fails and autoCleanStateAfterAuthentication is false', async () => {
      // Arrange
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(false);
      config.autoCleanStateAfterAuthentication = false;
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');

      // Act
      await firstValueFrom(
        stateValidationService.getValidatedStateResult(
          createCodeFlowCallbackContext({ state: 'state' }),
          config
        )
      );

      // Assert
      expect(writeSpy).toHaveBeenCalledExactlyOnceWith(
        'authNonce',
        null,
        config
      );
    });
  });
});
