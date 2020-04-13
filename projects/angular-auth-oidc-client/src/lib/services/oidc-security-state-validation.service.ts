import { Injectable } from '@angular/core';
import { JwtKeys } from '../models/jwtkeys';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { ValidationResult } from '../models/validation-result.enum';
import { ConfigurationProvider } from './auth-configuration.provider';
import { TokenHelperService } from './oidc-token-helper.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecurityValidation } from './oidc.security.validation';

@Injectable()
export class StateValidationService {
    constructor(
        public oidcSecurityCommon: OidcSecurityCommon,
        private oidcSecurityValidation: OidcSecurityValidation,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    validateState(result: any, jwtKeys: JwtKeys): ValidateStateResult {
        const toReturn = new ValidateStateResult();
        if (!this.oidcSecurityValidation.validateStateFromHashCallback(result.state, this.oidcSecurityCommon.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            toReturn.state = ValidationResult.StatesDoNotMatch;
            this.handleUnsuccessfulValidation();
            return toReturn;
        }

        if (
            this.configurationProvider.openIDConfiguration.responseType === 'id_token token' ||
            this.configurationProvider.openIDConfiguration.responseType === 'code'
        ) {
            toReturn.accessToken = result.access_token;
        }

        if (result.id_token) {
            toReturn.idToken = result.id_token;

            toReturn.decodedIdToken = this.tokenHelperService.getPayloadFromToken(toReturn.idToken, false);

            if (!this.oidcSecurityValidation.validateSignatureIdToken(toReturn.idToken, jwtKeys)) {
                this.loggerService.logDebug('authorizedCallback Signature validation failed id_token');
                toReturn.state = ValidationResult.SignatureFailed;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (
                !this.oidcSecurityValidation.validateIdTokenNonce(
                    toReturn.decodedIdToken,
                    this.oidcSecurityCommon.authNonce,
                    this.configurationProvider.openIDConfiguration.ignoreNonceAfterRefresh
                )
            ) {
                this.loggerService.logWarning('authorizedCallback incorrect nonce');
                toReturn.state = ValidationResult.IncorrectNonce;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (!this.oidcSecurityValidation.validateRequiredIdToken(toReturn.decodedIdToken)) {
                this.loggerService.logDebug('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
                toReturn.state = ValidationResult.RequiredPropertyMissing;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (
                !this.oidcSecurityValidation.validateIdTokenIatMaxOffset(
                    toReturn.decodedIdToken,
                    this.configurationProvider.openIDConfiguration.maxIdTokenIatOffsetAllowedInSeconds,
                    this.configurationProvider.openIDConfiguration.disableIatOffsetValidation
                )
            ) {
                this.loggerService.logWarning(
                    'authorizedCallback Validation, iat rejected id_token was issued too far away from the current time'
                );
                toReturn.state = ValidationResult.MaxOffsetExpired;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (this.configurationProvider.wellKnownEndpoints) {
                if (this.configurationProvider.openIDConfiguration.issValidationOff) {
                    this.loggerService.logDebug('iss validation is turned off, this is not recommended!');
                } else if (
                    !this.configurationProvider.openIDConfiguration.issValidationOff &&
                    !this.oidcSecurityValidation.validateIdTokenIss(
                        toReturn.decodedIdToken,
                        this.configurationProvider.wellKnownEndpoints.issuer
                    )
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
                !this.oidcSecurityValidation.validateIdTokenAud(
                    toReturn.decodedIdToken,
                    this.configurationProvider.openIDConfiguration.clientId
                )
            ) {
                this.loggerService.logWarning('authorizedCallback incorrect aud');
                toReturn.state = ValidationResult.IncorrectAud;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (!this.oidcSecurityValidation.validateIdTokenExpNotExpired(toReturn.decodedIdToken)) {
                this.loggerService.logWarning('authorizedCallback token expired');
                toReturn.state = ValidationResult.TokenExpired;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }
        } else {
            this.loggerService.logDebug('No id_token found, skipping id_token validation');
        }

        // flow id_token token
        if (
            this.configurationProvider.openIDConfiguration.responseType !== 'id_token token' &&
            this.configurationProvider.openIDConfiguration.responseType !== 'code'
        ) {
            toReturn.authResponseIsValid = true;
            toReturn.state = ValidationResult.Ok;
            this.handleSuccessfulValidation();
            this.handleUnsuccessfulValidation();
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validateIdTokenAtHash(
                toReturn.accessToken,
                toReturn.decodedIdToken.at_hash,
                this.configurationProvider.openIDConfiguration.responseType === 'code'
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

    private handleSuccessfulValidation() {
        this.oidcSecurityCommon.authNonce = '';

        if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) validated, continue');
    }

    private handleUnsuccessfulValidation() {
        this.oidcSecurityCommon.authNonce = '';

        if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) invalid');
    }
}
