import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { EqualityService } from '../utils/equality/equality.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/oidc-token-helper.service';
import { StateValidationResult } from './state-validation-result';
import { TokenValidationService } from './token-validation.service';
import { ValidationResult } from './validation-result';

@Injectable()
export class StateValidationService {
  constructor(
    private storagePersistanceService: StoragePersistanceService,
    private tokenValidationService: TokenValidationService,
    private tokenHelperService: TokenHelperService,
    private loggerService: LoggerService,
    private configurationProvider: ConfigurationProvider,
    private equalityService: EqualityService,
    private flowHelper: FlowHelper
  ) {}

  getValidatedStateResult(callbackContext: CallbackContext): StateValidationResult {
    if (!callbackContext) {
      return new StateValidationResult('', '', false, {});
    }

    if (callbackContext.authResult.error) {
      return new StateValidationResult('', '', false, {});
    }

    return this.validateState(callbackContext);
  }

  validateState(callbackContext): StateValidationResult {
    const toReturn = new StateValidationResult();
    const authStateControl = this.storagePersistanceService.read('authStateControl');

    if (!this.tokenValidationService.validateStateFromHashCallback(callbackContext.authResult.state, authStateControl)) {
      this.loggerService.logWarning('authorizedCallback incorrect state');
      toReturn.state = ValidationResult.StatesDoNotMatch;
      this.handleUnsuccessfulValidation();
      return toReturn;
    }

    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken();
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow();

    if (isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow) {
      toReturn.accessToken = callbackContext.authResult.access_token;
    }

    if (callbackContext.authResult.id_token) {
      toReturn.idToken = callbackContext.authResult.id_token;

      toReturn.decodedIdToken = this.tokenHelperService.getPayloadFromToken(toReturn.idToken, false);

      if (!this.tokenValidationService.validateSignatureIdToken(toReturn.idToken, callbackContext.jwtKeys)) {
        this.loggerService.logDebug('authorizedCallback Signature validation failed id_token');
        toReturn.state = ValidationResult.SignatureFailed;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      const authNonce = this.storagePersistanceService.read('authNonce');

      if (
        !this.tokenValidationService.validateIdTokenNonce(
          toReturn.decodedIdToken,
          authNonce,
          this.configurationProvider.openIDConfiguration.ignoreNonceAfterRefresh
        )
      ) {
        this.loggerService.logWarning('authorizedCallback incorrect nonce');
        toReturn.state = ValidationResult.IncorrectNonce;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (!this.tokenValidationService.validateRequiredIdToken(toReturn.decodedIdToken)) {
        this.loggerService.logDebug('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
        toReturn.state = ValidationResult.RequiredPropertyMissing;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (
        !this.tokenValidationService.validateIdTokenIatMaxOffset(
          toReturn.decodedIdToken,
          this.configurationProvider.openIDConfiguration.maxIdTokenIatOffsetAllowedInSeconds,
          this.configurationProvider.openIDConfiguration.disableIatOffsetValidation
        )
      ) {
        this.loggerService.logWarning('authorizedCallback Validation, iat rejected id_token was issued too far away from the current time');
        toReturn.state = ValidationResult.MaxOffsetExpired;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');

      if (authWellKnownEndPoints) {
        if (this.configurationProvider.openIDConfiguration.issValidationOff) {
          this.loggerService.logDebug('iss validation is turned off, this is not recommended!');
        } else if (
          !this.configurationProvider.openIDConfiguration.issValidationOff &&
          !this.tokenValidationService.validateIdTokenIss(toReturn.decodedIdToken, authWellKnownEndPoints.issuer)
        ) {
          this.loggerService.logWarning('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');
          toReturn.state = ValidationResult.IssDoesNotMatchIssuer;
          this.handleUnsuccessfulValidation();
          return toReturn;
        }
      } else {
        this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        toReturn.state = ValidationResult.NoAuthWellKnownEndPoints;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (
        !this.tokenValidationService.validateIdTokenAud(toReturn.decodedIdToken, this.configurationProvider.openIDConfiguration.clientId)
      ) {
        this.loggerService.logWarning('authorizedCallback incorrect aud');
        toReturn.state = ValidationResult.IncorrectAud;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(toReturn.decodedIdToken)) {
        this.loggerService.logWarning('authorizedCallback missing azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (
        !this.tokenValidationService.validateIdTokenAzpValid(
          toReturn.decodedIdToken,
          this.configurationProvider.openIDConfiguration.clientId
        )
      ) {
        this.loggerService.logWarning('authorizedCallback incorrect azp');
        toReturn.state = ValidationResult.IncorrectAzp;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (!this.isIdTokenAfterRefreshTokenRequestValid(callbackContext, toReturn.decodedIdToken)) {
        this.loggerService.logWarning('authorizedCallback pre, post id_token claims do not match in refresh');
        toReturn.state = ValidationResult.IncorrectIdTokenClaimsAfterRefresh;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }

      if (!this.tokenValidationService.validateIdTokenExpNotExpired(toReturn.decodedIdToken)) {
        this.loggerService.logWarning('authorizedCallback id token expired');
        toReturn.state = ValidationResult.TokenExpired;
        this.handleUnsuccessfulValidation();
        return toReturn;
      }
    } else {
      this.loggerService.logDebug('No id_token found, skipping id_token validation');
    }

    // flow id_token
    if (!isCurrentFlowImplicitFlowWithAccessToken && !isCurrentFlowCodeFlow) {
      toReturn.authResponseIsValid = true;
      toReturn.state = ValidationResult.Ok;
      this.handleSuccessfulValidation();
      this.handleUnsuccessfulValidation();
      return toReturn;
    }

    const idTokenHeader = this.tokenHelperService.getHeaderFromToken(toReturn.idToken, false);

    // The at_hash is optional for the code flow
    if (isCurrentFlowCodeFlow && !(toReturn.decodedIdToken.at_hash as string)) {
      this.loggerService.logDebug('Code Flow active, and no at_hash in the id_token, skipping check!');
    } else if (
      !this.tokenValidationService.validateIdTokenAtHash(
        toReturn.accessToken,
        toReturn.decodedIdToken.at_hash,
        idTokenHeader.alg // 'RSA256'
      ) ||
      !toReturn.accessToken
    ) {
      this.loggerService.logWarning('authorizedCallback incorrect at_hash');
      toReturn.state = ValidationResult.IncorrectAtHash;
      this.handleUnsuccessfulValidation();
      return toReturn;
    }

    toReturn.authResponseIsValid = true;
    toReturn.state = ValidationResult.Ok;
    this.handleSuccessfulValidation();
    return toReturn;
  }

  private isIdTokenAfterRefreshTokenRequestValid(callbackContext: CallbackContext, newIdToken: any): boolean {
    if (!this.configurationProvider.openIDConfiguration.useRefreshToken) {
      return true;
    }

    if (!callbackContext.existingIdToken) {
      return true;
    }
    const decodedIdToken = this.tokenHelperService.getPayloadFromToken(callbackContext.existingIdToken, false);

    // Upon successful validation of the Refresh Token, the response body is the Token Response of Section 3.1.3.3
    // except that it might not contain an id_token.

    // If an ID Token is returned as a result of a token refresh request, the following requirements apply:

    // its iss Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.iss !== newIdToken.iss) {
      this.loggerService.logDebug(`iss do not match: ${decodedIdToken.iss} ${newIdToken.iss}`);
      return false;
    }
    // its azp Claim Value MUST be the same as in the ID Token issued when the original authentication occurred;
    //   if no azp Claim was present in the original ID Token, one MUST NOT be present in the new ID Token, and
    // otherwise, the same rules apply as apply when issuing an ID Token at the time of the original authentication.
    if (decodedIdToken.azp !== newIdToken.azp) {
      this.loggerService.logDebug(`azp do not match: ${decodedIdToken.azp} ${newIdToken.azp}`);
      return false;
    }
    // its sub Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (decodedIdToken.sub !== newIdToken.sub) {
      this.loggerService.logDebug(`sub do not match: ${decodedIdToken.sub} ${newIdToken.sub}`);
      return false;
    }

    // its aud Claim Value MUST be the same as in the ID Token issued when the original authentication occurred,
    if (!this.equalityService.isStringEqualOrNonOrderedArrayEqual(decodedIdToken?.aud, newIdToken?.aud)) {
      this.loggerService.logDebug(`aud in new id_token is not valid: '${decodedIdToken?.aud}' '${newIdToken.aud}'`);
      return false;
    }

    if (this.configurationProvider.openIDConfiguration.disableRefreshIdTokenAuthTimeValidation) {
      return true;
    }

    // its iat Claim MUST represent the time that the new ID Token is issued,
    // if the ID Token contains an auth_time Claim, its value MUST represent the time of the original authentication
    // - not the time that the new ID token is issued,
    if (decodedIdToken.auth_time !== newIdToken.auth_time) {
      this.loggerService.logDebug(`auth_time do not match: ${decodedIdToken.auth_time} ${newIdToken.auth_time}`);
      return false;
    }

    return true;
  }

  private handleSuccessfulValidation(): void {
    this.storagePersistanceService.write('authNonce', '');

    if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
      this.storagePersistanceService.write('authStateControl', '');
    }
    this.loggerService.logDebug('AuthorizedCallback token(s) validated, continue');
  }

  private handleUnsuccessfulValidation(): void {
    this.storagePersistanceService.write('authNonce', '');

    if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
      this.storagePersistanceService.write('authStateControl', '');
    }
    this.loggerService.logDebug('AuthorizedCallback token(s) invalid');
  }
}
