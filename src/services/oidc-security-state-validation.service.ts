import { Injectable } from '@angular/core';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecurityValidation } from './oidc.security.validation';
import { AuthConfiguration } from '../modules/auth.configuration';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { JwtKeys } from '../models/jwtkeys';

@Injectable()
export class StateValidationService {
    constructor(
        private authConfiguration: AuthConfiguration,
        public oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints,
        private oidcSecurityValidation: OidcSecurityValidation
    ) {}

    public validateState(result: any, jwtKeys: JwtKeys): ValidateStateResult {
        const toReturn = new ValidateStateResult('', '', false, {});
        if (
            !this.oidcSecurityValidation.validateStateFromHashCallback(
                result.state,
                this.oidcSecurityCommon.authStateControl
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback incorrect state'
            );
            return toReturn;
        }

        if (this.authConfiguration.response_type === 'id_token token') {
            toReturn.access_token = result.access_token;
        }
        toReturn.id_token = result.id_token;

        toReturn.decoded_id_token = this.oidcSecurityValidation.getPayloadFromToken(
            toReturn.id_token,
            false
        );

        if (
            !this.oidcSecurityValidation.validate_signature_id_token(
                toReturn.id_token,
                jwtKeys
            )
        ) {
            this.oidcSecurityCommon.logDebug(
                'authorizedCallback Signature validation failed id_token'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_nonce(
                toReturn.decoded_id_token,
                this.oidcSecurityCommon.authNonce
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback incorrect nonce'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_required_id_token(
                toReturn.decoded_id_token
            )
        ) {
            this.oidcSecurityCommon.logDebug(
                'authorizedCallback Validation, one of the REQUIRED properties missing from id_token'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_iat_max_offset(
                toReturn.decoded_id_token,
                this.authConfiguration
                    .max_id_token_iat_offset_allowed_in_seconds
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback Validation, iat rejected id_token was issued too far away from the current time'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_iss(
                toReturn.decoded_id_token,
                this.authWellKnownEndpoints.issuer
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_aud(
                toReturn.decoded_id_token,
                this.authConfiguration.client_id
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback incorrect aud'
            );
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_exp_not_expired(
                toReturn.decoded_id_token
            )
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback token expired'
            );
            return toReturn;
        }

        // flow id_token token
        if (this.authConfiguration.response_type !== 'id_token token') {
            toReturn.authResponseIsValid = true;
            this.successful_validation();
            return toReturn;
        }

        if (
            !this.oidcSecurityValidation.validate_id_token_at_hash(
                toReturn.access_token,
                toReturn.decoded_id_token.at_hash
            ) ||
            !toReturn.access_token
        ) {
            this.oidcSecurityCommon.logWarning(
                'authorizedCallback incorrect at_hash'
            );
            return toReturn;
        }

        toReturn.authResponseIsValid = true;
        this.successful_validation();
        return toReturn;
    }

    private successful_validation() {
        this.oidcSecurityCommon.authNonce = '';

        if (this.authConfiguration.auto_clean_state_after_authentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.oidcSecurityCommon.logDebug(
            'AuthorizedCallback token(s) validated, continue'
        );
    }
}
