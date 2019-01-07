import { Injectable } from '@angular/core';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { JwtKeys } from '../models/jwtkeys';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { ValidationResult } from '../models/validation-result.enum';
import { AuthConfiguration } from '../modules/auth.configuration';
import { TokenHelperService } from './oidc-token-helper.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecurityValidation } from './oidc.security.validation';

@Injectable()
export class StateValidationService {
    private authWellKnownEndpoints = new AuthWellKnownEndpoints();
    constructor(
        private authConfiguration: AuthConfiguration,
        public oidcSecurityCommon: OidcSecurityCommon,
        private oidcSecurityValidation: OidcSecurityValidation,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService
    ) {}

    setupModule(authWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    }

    validateState(result: any, jwtKeys: JwtKeys): ValidateStateResult {
        const toReturn = new ValidateStateResult();
        if (!this.oidcSecurityValidation.validateStateFromHashCallback(result.state, this.oidcSecurityCommon.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            toReturn.state = ValidationResult.StatesDoNotMatch;
            return toReturn;
        }

        if (this.authConfiguration.response_type === 'id_token token' || this.authConfiguration.response_type === 'code') {
            toReturn.access_token = result.access_token;
        }

        toReturn.id_token = result.id_token;

        toReturn.decoded_id_token = this.tokenHelperService.getPayloadFromToken(toReturn.id_token, false);

        if (!this.oidcSecurityValidation.validate_signature_id_token(toReturn.id_token, jwtKeys)) {
            this.loggerService.logDebug('authorizedCallback Signature validation failed id_token');
            toReturn.state = ValidationResult.SignatureFailed;
            return toReturn;
        }

        if (!this.oidcSecurityValidation.validate_id_token_nonce(toReturn.decoded_id_token, this.oidcSecurityCommon.authNonce)) {
            this.loggerService.logWarning('authorizedCallback incorrect nonce');
            toReturn.state = ValidationResult.IncorrectNonce;
            return toReturn;
        }

        if (!this.oidcSecurityValidation.validate_required_id_token(toReturn.decoded_id_token)) {
            this.loggerService.logDebug('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
            toReturn.state = ValidationResult.RequiredPropertyMissing;
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_iat_max_offset(
                toReturn.decoded_id_token,
                this.authConfiguration.max_id_token_iat_offset_allowed_in_seconds
            )
        ) {
            this.loggerService.logWarning('authorizedCallback Validation, iat rejected id_token was issued too far away from the current time');
            toReturn.state = ValidationResult.MaxOffsetExpired;
            return toReturn;
        }

        if (this.authWellKnownEndpoints) {
            if (this.authConfiguration.iss_validation_off) {
                this.loggerService.logDebug('iss validation is turned off, this is not recommended!');
            } else if (!this.authConfiguration.iss_validation_off &&
                !this.oidcSecurityValidation.validate_id_token_iss(toReturn.decoded_id_token, this.authWellKnownEndpoints.issuer)) {
                this.loggerService.logWarning('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');
                toReturn.state = ValidationResult.IssDoesNotMatchIssuer;
                return toReturn;
            }
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            toReturn.state = ValidationResult.NoAuthWellKnownEndPoints;
            return toReturn;
        }

        if (!this.oidcSecurityValidation.validate_id_token_aud(toReturn.decoded_id_token, this.authConfiguration.client_id)) {
            this.loggerService.logWarning('authorizedCallback incorrect aud');
            toReturn.state = ValidationResult.IncorrectAud;
            return toReturn;
        }

        if (!this.oidcSecurityValidation.validate_id_token_exp_not_expired(toReturn.decoded_id_token)) {
            this.loggerService.logWarning('authorizedCallback token expired');
            toReturn.state = ValidationResult.TokenExpired;
            return toReturn;
        }

        // flow id_token token
        if (this.authConfiguration.response_type !== 'id_token token' && this.authConfiguration.response_type !== 'code') {
            toReturn.authResponseIsValid = true;
            toReturn.state = ValidationResult.Ok;
            this.handleSuccessfulValidation();
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_at_hash(toReturn.access_token, toReturn.decoded_id_token.at_hash) ||
            !toReturn.access_token
        ) {
            this.loggerService.logWarning('authorizedCallback incorrect at_hash');
            toReturn.state = ValidationResult.IncorrectAtHash;
            return toReturn;
        }

        toReturn.authResponseIsValid = true;
        toReturn.state = ValidationResult.Ok;
        this.handleSuccessfulValidation();
        return toReturn;
    }

    private handleSuccessfulValidation() {
        this.oidcSecurityCommon.authNonce = '';

        if (this.authConfiguration.auto_clean_state_after_authentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) validated, continue');
    }
}
