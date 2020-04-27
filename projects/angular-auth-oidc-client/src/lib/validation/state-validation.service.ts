import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/oidc-token-helper.service';
import { JwtKeys } from './jwtkeys';
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
        private readonly configurationProvider: ConfigurationProvider,
        private readonly flowHelper: FlowHelper
    ) {}

    getValidatedStateResult(result: any, jwtKeys: JwtKeys): StateValidationResult {
        if (result.error) {
            return new StateValidationResult('', '', false, {});
        }

        return this.validateState(result, jwtKeys);
    }

    validateState(result: any, jwtKeys: JwtKeys): StateValidationResult {
        const toReturn = new StateValidationResult();
        if (!this.tokenValidationService.validateStateFromHashCallback(result.state, this.storagePersistanceService.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            toReturn.state = ValidationResult.StatesDoNotMatch;
            this.handleUnsuccessfulValidation();
            return toReturn;
        }

        const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken();
        const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow();

        if (isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow) {
            toReturn.accessToken = result.access_token;
        }

        if (result.id_token) {
            toReturn.idToken = result.id_token;

            toReturn.decodedIdToken = this.tokenHelperService.getPayloadFromToken(toReturn.idToken, false);

            if (!this.tokenValidationService.validateSignatureIdToken(toReturn.idToken, jwtKeys)) {
                this.loggerService.logDebug('authorizedCallback Signature validation failed id_token');
                toReturn.state = ValidationResult.SignatureFailed;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (
                !this.tokenValidationService.validateIdTokenNonce(
                    toReturn.decodedIdToken,
                    this.storagePersistanceService.authNonce,
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
                    !this.tokenValidationService.validateIdTokenIss(
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
                !this.tokenValidationService.validateIdTokenAud(
                    toReturn.decodedIdToken,
                    this.configurationProvider.openIDConfiguration.clientId
                )
            ) {
                this.loggerService.logWarning('authorizedCallback incorrect aud');
                toReturn.state = ValidationResult.IncorrectAud;
                this.handleUnsuccessfulValidation();
                return toReturn;
            }

            if (
                !this.tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(
                    toReturn.decodedIdToken,
                    this.configurationProvider.openIDConfiguration.clientId
                )
            ) {
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

            if (!this.tokenValidationService.validateIdTokenExpNotExpired(toReturn.decodedIdToken)) {
                this.loggerService.logWarning('authorizedCallback token expired');
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

        if (
            !this.tokenValidationService.validateIdTokenAtHash(
                toReturn.accessToken,
                toReturn.decodedIdToken.at_hash,
                isCurrentFlowCodeFlow
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
        this.storagePersistanceService.authNonce = '';

        if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
            this.storagePersistanceService.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) validated, continue');
    }

    private handleUnsuccessfulValidation() {
        this.storagePersistanceService.authNonce = '';

        if (this.configurationProvider.openIDConfiguration.autoCleanStateAfterAuthentication) {
            this.storagePersistanceService.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) invalid');
    }
}
