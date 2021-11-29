import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
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
    private equalityService: EqualityService,
    private flowHelper: FlowHelper
  ) {}

  getValidatedStateResult(callbackContext: CallbackContext, configuration: OpenIdConfiguration): StateValidationResult {
    if (!callbackContext) {
      return new StateValidationResult('', '', false, {});
    }

    if (callbackContext.authResult.error) {
      return new StateValidationResult('', '', false, {});
    }

    return this.validateState(callbackContext, configuration);
  }

  validateState(callbackContext: any, configuration: OpenIdConfiguration): StateValidationResult {
    const toReturn = new StateValidationResult();
    const authStateControl = this.storagePersistenceService.read('authStateControl', configuration);

    if (!this.tokenValidationService.validateStateFromHashCallback(callbackContext.authResult.state, authStateControl, configuration)) {
      this.loggerService.logWarning(configuration, 'authCallback incorrect state');
      toReturn.state = ValidationResult.StatesDoNotMatch;
      this.handleUnsuccessfulValidation(configuration);

      return toReturn;
    }

    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken(configuration);
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(configuration);

    if (isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow) {
      toReturn.accessToken = callbackContext.authResult.access_token;
    }

    if (callbackContext.authResult.id_token) {
      const { clientId, issValidationOff, maxIdTokenIatOffsetAllowedInSeconds, disableIatOffsetValidation, ignoreNonceAfterRefresh } =
        configuration;

      toReturn.idToken = callbackContext.authResult.id_token;

      toReturn.decodedIdToken = this.tokenHelperService.getPayloadFromToken(toReturn.idToken, false, configuration);

      if (!this.tokenValidationService.validateSignatureIdToken(toReturn.idToken, callbackContext.jwtKeys, configuration)) {
        this.loggerService.logDebug(configuration, 'authCallback Signature validation failed id_token');
        toReturn.state = ValidationResult.SignatureFailed;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      const authNonce = this.storagePersistenceService.read('authNonce', configuration);

      if (!this.tokenValidationService.validateIdTokenNonce(toReturn.decodedIdToken, authNonce, ignoreNonceAfterRefresh, configuration)) {
        this.loggerService.logWarning(configuration, 'authCallback incorrect nonce, did you call the checkAuth() method multiple times?');
        toReturn.state = ValidationResult.IncorrectNonce;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.tokenValidationService.validateRequiredIdToken(toReturn.decodedIdToken, configuration)) {
        this.loggerService.logDebug(configuration, 'authCallback Validation, one of the REQUIRED properties missing from id_token');
        toReturn.state = ValidationResult.RequiredPropertyMissing;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (
        !this.tokenValidationService.validateIdTokenIatMaxOffset(
          toReturn.decodedIdToken,
          maxIdTokenIatOffsetAllowedInSeconds,
          disableIatOffsetValidation,
          configuration
        )
      ) {
        this.loggerService.logWarning(
          configuration,
          'authCallback Validation, iat rejected id_token was issued too far away from the current time'
        );
        toReturn.state = ValidationResult.MaxOffsetExpired;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

      if (authWellKnownEndPoints) {
        if (issValidationOff) {
          this.loggerService.logDebug(configuration, 'iss validation is turned off, this is not recommended!');
        } else if (
          !issValidationOff &&
          !this.tokenValidationService.validateIdTokenIss(toReturn.decodedIdToken, authWellKnownEndPoints.issuer, configuration)
        ) {
          this.loggerService.logWarning(configuration, 'authCallback incorrect iss does not match authWellKnownEndpoints issuer');
          toReturn.state = ValidationResult.IssDoesNotMatchIssuer;
          this.handleUnsuccessfulValidation(configuration);

          return toReturn;
        }
      } else {
        this.loggerService.logWarning(configuration, 'authWellKnownEndpoints is undefined');
        toReturn.state = ValidationResult.NoAuthWellKnownEndPoints;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAud(toReturn.decodedIdToken, clientId, configuration)) {
        this.loggerService.logWarning(configuration, 'authCallback incorrect aud');
        toReturn.state = ValidationResult.IncorrectAud;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(toReturn.decodedIdToken)) {
        this.loggerService.logWarning(configuration, 'authCallback missing azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAzpValid(toReturn.decodedIdToken, clientId)) {
        this.loggerService.logWarning(configuration, 'authCallback incorrect azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.isIdTokenAfterRefreshTokenRequestValid(callbackContext, toReturn.decodedIdToken, configuration)) {
        this.loggerService.logWarning(configuration, 'authCallback pre, post id_token claims do not match in refresh');
        toReturn.state = ValidationResult.IncorrectIdTokenClaimsAfterRefresh;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenExpNotExpired(toReturn.decodedIdToken, configuration)) {
        this.loggerService.logWarning(configuration, 'authCallback id token expired');
        toReturn.state = ValidationResult.TokenExpired;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }
    } else {
      this.loggerService.logDebug(configuration, 'No id_token found, skipping id_token validation');
    }

    // flow id_token
    if (!isCurrentFlowImplicitFlowWithAccessToken && !isCurrentFlowCodeFlow) {
      toReturn.authResponseIsValid = true;
      toReturn.state = ValidationResult.Ok;
      this.handleSuccessfulValidation(configuration);
      this.handleUnsuccessfulValidation(configuration);

      return toReturn;
    }

    // only do check if id_token returned, no always the case when using refresh tokens
    if (callbackContext.authResult.id_token) {
      const idTokenHeader = this.tokenHelperService.getHeaderFromToken(toReturn.idToken, false, configuration);

      // The at_hash is optional for the code flow
      if (isCurrentFlowCodeFlow && !(toReturn.decodedIdToken.at_hash as string)) {
        this.loggerService.logDebug(configuration, 'Code Flow active, and no at_hash in the id_token, skipping check!');
      } else if (
        !this.tokenValidationService.validateIdTokenAtHash(
          toReturn.accessToken,
          toReturn.decodedIdToken.at_hash,
          idTokenHeader.alg, // 'RSA256'
          configuration
        ) ||
        !toReturn.accessToken
      ) {
        this.loggerService.logWarning(configuration, 'authCallback incorrect at_hash');
        toReturn.state = ValidationResult.IncorrectAtHash;
        this.handleUnsuccessfulValidation(configuration);

        return toReturn;
      }
    }

    toReturn.authResponseIsValid = true;
    toReturn.state = ValidationResult.Ok;
    this.handleSuccessfulValidation(configuration);

    return toReturn;
  }

  private isIdTokenAfterRefreshTokenRequestValid(
    callbackContext: CallbackContext,
    newIdToken: any,
    configuration: OpenIdConfiguration
  ): boolean {
    const { useRefreshToken, disableRefreshIdTokenAuthTimeValidation } = configuration;
    if (!useRefreshToken) {
      return true;
    }

    if (!callbackContext.existingIdToken) {
      return true;
    }

    const decodedIdToken = this.tokenHelperService.getPayloadFromToken(callbackContext.existingIdToken, false, configuration);

    // Upon successful validation of the Refresh Token, the response body is the Token Response of Section 3.1.3.3
    // except that it might not contain an id_token.

    // If an ID Token is returned as a result of a token refresh request, the following requirements apply:

    // its iss Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.iss !== newIdToken.iss) {
      this.loggerService.logDebug(configuration, `iss do not match: ${decodedIdToken.iss} ${newIdToken.iss}`);

      return false;
    }
    // its azp Claim Value MUST be the same as in the ID Token issued when the original authentication occurred;
    //   if no azp Claim was present in the original ID Token, one MUST NOT be present in the new ID Token, and
    // otherwise, the same rules apply as apply when issuing an ID Token at the time of the original authentication.
    if (decodedIdToken.azp !== newIdToken.azp) {
      this.loggerService.logDebug(configuration, `azp do not match: ${decodedIdToken.azp} ${newIdToken.azp}`);

      return false;
    }
    // its sub Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.sub !== newIdToken.sub) {
      this.loggerService.logDebug(configuration, `sub do not match: ${decodedIdToken.sub} ${newIdToken.sub}`);

      return false;
    }

    // its aud Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (!this.equalityService.isStringEqualOrNonOrderedArrayEqual(decodedIdToken?.aud, newIdToken?.aud)) {
      this.loggerService.logDebug(configuration, `aud in new id_token is not valid: '${decodedIdToken?.aud}' '${newIdToken.aud}'`);

      return false;
    }

    if (disableRefreshIdTokenAuthTimeValidation) {
      return true;
    }

    // its iat Claim MUST represent the time that the new ID Token is issued,
    // if the ID Token contains an auth_time Claim, its value MUST represent the time of the original authentication
    // - not the time that the new ID token is issued,
    if (decodedIdToken.auth_time !== newIdToken.auth_time) {
      this.loggerService.logDebug(configuration, `auth_time do not match: ${decodedIdToken.auth_time} ${newIdToken.auth_time}`);

      return false;
    }

    return true;
  }

  private handleSuccessfulValidation(configuration: OpenIdConfiguration): void {
    const { autoCleanStateAfterAuthentication } = configuration;
    this.storagePersistenceService.write('authNonce', null, configuration);

    if (autoCleanStateAfterAuthentication) {
      this.storagePersistenceService.write('authStateControl', '', configuration);
    }
    this.loggerService.logDebug(configuration, 'authCallback token(s) validated, continue');
  }

  private handleUnsuccessfulValidation(configuration: OpenIdConfiguration): void {
    const { autoCleanStateAfterAuthentication } = configuration;
    this.storagePersistenceService.write('authNonce', null, configuration);

    if (autoCleanStateAfterAuthentication) {
      this.storagePersistenceService.write('authStateControl', '', configuration);
    }
    this.loggerService.logDebug(configuration, 'authCallback token(s) invalid');
  }
}
