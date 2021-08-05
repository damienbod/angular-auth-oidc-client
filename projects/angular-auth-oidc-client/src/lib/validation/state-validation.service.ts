import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { EqualityService } from '../utils/equality/equality.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { StateValidationResult } from './state-validation-result';
import { TokenValidationService } from './token-validation.service';
import { ValidationResult } from './validation-result';

@Injectable()
export class StateValidationService {
  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private tokenValidationService: TokenValidationService,
    private tokenHelperService: TokenHelperService,
    private loggerService: LoggerService,
    private configurationProvider: ConfigurationProvider,
    private equalityService: EqualityService,
    private flowHelper: FlowHelper
  ) {}

  getValidatedStateResult(callbackContext: CallbackContext, configId: string): StateValidationResult {
    if (!callbackContext) {
      return new StateValidationResult('', '', false, {});
    }

    if (callbackContext.authResult.error) {
      return new StateValidationResult('', '', false, {});
    }

    return this.validateState(callbackContext, configId);
  }

  validateState(callbackContext: any, configId: string): StateValidationResult {
    const toReturn = new StateValidationResult();
    const authStateControl = this.storagePersistenceService.read('authStateControl', configId);

    if (!this.tokenValidationService.validateStateFromHashCallback(callbackContext.authResult.state, authStateControl, configId)) {
      this.loggerService.logWarning(configId, 'authCallback incorrect state');
      toReturn.state = ValidationResult.StatesDoNotMatch;
      this.handleUnsuccessfulValidation(configId);

      return toReturn;
    }

    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken(configId);
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(configId);

    if (isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow) {
      toReturn.accessToken = callbackContext.authResult.access_token;
    }

    if (callbackContext.authResult.id_token) {
      const { clientId, issValidationOff, maxIdTokenIatOffsetAllowedInSeconds, disableIatOffsetValidation, ignoreNonceAfterRefresh } =
        this.configurationProvider.getOpenIDConfiguration(configId);

      toReturn.idToken = callbackContext.authResult.id_token;

      toReturn.decodedIdToken = this.tokenHelperService.getPayloadFromToken(toReturn.idToken, false, configId);

      if (!this.tokenValidationService.validateSignatureIdToken(toReturn.idToken, callbackContext.jwtKeys, configId)) {
        this.loggerService.logDebug(configId, 'authCallback Signature validation failed id_token');
        toReturn.state = ValidationResult.SignatureFailed;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      const authNonce = this.storagePersistenceService.read('authNonce', configId);

      if (!this.tokenValidationService.validateIdTokenNonce(toReturn.decodedIdToken, authNonce, ignoreNonceAfterRefresh, configId)) {
        this.loggerService.logWarning(configId, 'authCallback incorrect nonce, did you call the checkAuth() method multiple times?');
        toReturn.state = ValidationResult.IncorrectNonce;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.tokenValidationService.validateRequiredIdToken(toReturn.decodedIdToken, configId)) {
        this.loggerService.logDebug(configId, 'authCallback Validation, one of the REQUIRED properties missing from id_token');
        toReturn.state = ValidationResult.RequiredPropertyMissing;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (
        !this.tokenValidationService.validateIdTokenIatMaxOffset(
          toReturn.decodedIdToken,
          maxIdTokenIatOffsetAllowedInSeconds,
          disableIatOffsetValidation,
          configId
        )
      ) {
        this.loggerService.logWarning(
          configId,
          'authCallback Validation, iat rejected id_token was issued too far away from the current time'
        );
        toReturn.state = ValidationResult.MaxOffsetExpired;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);

      if (authWellKnownEndPoints) {
        if (issValidationOff) {
          this.loggerService.logDebug(configId, 'iss validation is turned off, this is not recommended!');
        } else if (
          !issValidationOff &&
          !this.tokenValidationService.validateIdTokenIss(toReturn.decodedIdToken, authWellKnownEndPoints.issuer, configId)
        ) {
          this.loggerService.logWarning(configId, 'authCallback incorrect iss does not match authWellKnownEndpoints issuer');
          toReturn.state = ValidationResult.IssDoesNotMatchIssuer;
          this.handleUnsuccessfulValidation(configId);

          return toReturn;
        }
      } else {
        this.loggerService.logWarning(configId, 'authWellKnownEndpoints is undefined');
        toReturn.state = ValidationResult.NoAuthWellKnownEndPoints;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAud(toReturn.decodedIdToken, clientId, configId)) {
        this.loggerService.logWarning(configId, 'authCallback incorrect aud');
        toReturn.state = ValidationResult.IncorrectAud;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(toReturn.decodedIdToken)) {
        this.loggerService.logWarning(configId, 'authCallback missing azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAzpValid(toReturn.decodedIdToken, clientId)) {
        this.loggerService.logWarning(configId, 'authCallback incorrect azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.isIdTokenAfterRefreshTokenRequestValid(callbackContext, toReturn.decodedIdToken, configId)) {
        this.loggerService.logWarning(configId, 'authCallback pre, post id_token claims do not match in refresh');
        toReturn.state = ValidationResult.IncorrectIdTokenClaimsAfterRefresh;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenExpNotExpired(toReturn.decodedIdToken, configId)) {
        this.loggerService.logWarning(configId, 'authCallback id token expired');
        toReturn.state = ValidationResult.TokenExpired;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }
    } else {
      this.loggerService.logDebug(configId, 'No id_token found, skipping id_token validation');
    }

    // flow id_token
    if (!isCurrentFlowImplicitFlowWithAccessToken && !isCurrentFlowCodeFlow) {
      toReturn.authResponseIsValid = true;
      toReturn.state = ValidationResult.Ok;
      this.handleSuccessfulValidation(configId);
      this.handleUnsuccessfulValidation(configId);

      return toReturn;
    }

    // only do check if id_token returned, no always the case when using refresh tokens
    if (callbackContext.authResult.id_token) {
      const idTokenHeader = this.tokenHelperService.getHeaderFromToken(toReturn.idToken, false, configId);

      // The at_hash is optional for the code flow
      if (isCurrentFlowCodeFlow && !(toReturn.decodedIdToken.at_hash as string)) {
        this.loggerService.logDebug(configId, 'Code Flow active, and no at_hash in the id_token, skipping check!');
      } else if (
        !this.tokenValidationService.validateIdTokenAtHash(
          toReturn.accessToken,
          toReturn.decodedIdToken.at_hash,
          idTokenHeader.alg, // 'RS256'
          configId
        ) ||
        !toReturn.accessToken
      ) {
        this.loggerService.logWarning(configId, 'authCallback incorrect at_hash');
        toReturn.state = ValidationResult.IncorrectAtHash;
        this.handleUnsuccessfulValidation(configId);

        return toReturn;
      }
    }

    toReturn.authResponseIsValid = true;
    toReturn.state = ValidationResult.Ok;
    this.handleSuccessfulValidation(configId);

    return toReturn;
  }

  private isIdTokenAfterRefreshTokenRequestValid(callbackContext: CallbackContext, newIdToken: any, configId: string): boolean {
    const { useRefreshToken, disableRefreshIdTokenAuthTimeValidation } = this.configurationProvider.getOpenIDConfiguration(configId);
    if (!useRefreshToken) {
      return true;
    }

    if (!callbackContext.existingIdToken) {
      return true;
    }

    const decodedIdToken = this.tokenHelperService.getPayloadFromToken(callbackContext.existingIdToken, false, configId);

    // Upon successful validation of the Refresh Token, the response body is the Token Response of Section 3.1.3.3
    // except that it might not contain an id_token.

    // If an ID Token is returned as a result of a token refresh request, the following requirements apply:

    // its iss Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.iss !== newIdToken.iss) {
      this.loggerService.logDebug(configId, `iss do not match: ${decodedIdToken.iss} ${newIdToken.iss}`);

      return false;
    }
    // its azp Claim Value MUST be the same as in the ID Token issued when the original authentication occurred;
    //   if no azp Claim was present in the original ID Token, one MUST NOT be present in the new ID Token, and
    // otherwise, the same rules apply as apply when issuing an ID Token at the time of the original authentication.
    if (decodedIdToken.azp !== newIdToken.azp) {
      this.loggerService.logDebug(configId, `azp do not match: ${decodedIdToken.azp} ${newIdToken.azp}`);

      return false;
    }
    // its sub Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.sub !== newIdToken.sub) {
      this.loggerService.logDebug(configId, `sub do not match: ${decodedIdToken.sub} ${newIdToken.sub}`);

      return false;
    }

    // its aud Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (!this.equalityService.isStringEqualOrNonOrderedArrayEqual(decodedIdToken?.aud, newIdToken?.aud)) {
      this.loggerService.logDebug(configId, `aud in new id_token is not valid: '${decodedIdToken?.aud}' '${newIdToken.aud}'`);

      return false;
    }

    if (disableRefreshIdTokenAuthTimeValidation) {
      return true;
    }

    // its iat Claim MUST represent the time that the new ID Token is issued,
    // if the ID Token contains an auth_time Claim, its value MUST represent the time of the original authentication
    // - not the time that the new ID token is issued,
    if (decodedIdToken.auth_time !== newIdToken.auth_time) {
      this.loggerService.logDebug(configId, `auth_time do not match: ${decodedIdToken.auth_time} ${newIdToken.auth_time}`);

      return false;
    }

    return true;
  }

  private handleSuccessfulValidation(configId: string): void {
    const { autoCleanStateAfterAuthentication } = this.configurationProvider.getOpenIDConfiguration(configId);
    this.storagePersistenceService.write('authNonce', null, configId);

    if (autoCleanStateAfterAuthentication) {
      this.storagePersistenceService.write('authStateControl', '', configId);
    }
    this.loggerService.logDebug(configId, 'authCallback token(s) validated, continue');
  }

  private handleUnsuccessfulValidation(configId: string): void {
    const { autoCleanStateAfterAuthentication } = this.configurationProvider.getOpenIDConfiguration(configId);
    this.storagePersistenceService.write('authNonce', null, configId);

    if (autoCleanStateAfterAuthentication) {
      this.storagePersistenceService.write('authStateControl', '', configId);
    }
    this.loggerService.logDebug(configId, 'authCallback token(s) invalid');
  }
}
