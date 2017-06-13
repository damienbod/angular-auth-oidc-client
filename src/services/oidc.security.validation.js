var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { OidcSecurityCommon } from './oidc.security.common';
var OidcSecurityValidation = (function () {
    function OidcSecurityValidation(oidcSecurityCommon) {
        this.oidcSecurityCommon = oidcSecurityCommon;
    }
    OidcSecurityValidation.prototype.isTokenExpired = function (token, offsetSeconds) {
        var decoded;
        decoded = this.getPayloadFromToken(token, false);
        return !(this.validate_id_token_exp_not_expired(decoded, offsetSeconds));
    };
    OidcSecurityValidation.prototype.validate_id_token_exp_not_expired = function (decoded_id_token, offsetSeconds) {
        var tokenExpirationDate = this.getTokenExpirationDate(decoded_id_token);
        offsetSeconds = offsetSeconds || 0;
        if (tokenExpirationDate == null) {
            return false;
        }
        return (tokenExpirationDate.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
    };
    OidcSecurityValidation.prototype.validate_required_id_token = function (dataIdToken) {
        var validated = true;
        if (!dataIdToken.hasOwnProperty('iss')) {
            validated = false;
            this.oidcSecurityCommon.logWarning('iss missing, validatation REQUIRED prorpeties in id_token');
        }
        if (!dataIdToken.hasOwnProperty('sub')) {
            validated = false;
            this.oidcSecurityCommon.logWarning('sub missing, validatation REQUIRED prorpeties in id_token');
        }
        if (!dataIdToken.hasOwnProperty('aud')) {
            validated = false;
            this.oidcSecurityCommon.logWarning('aud missing, validatation REQUIRED prorpeties in id_token');
        }
        if (!dataIdToken.hasOwnProperty('exp')) {
            validated = false;
            this.oidcSecurityCommon.logWarning('exp missing, validatation REQUIRED prorpeties in id_token');
        }
        if (!dataIdToken.hasOwnProperty('iat')) {
            validated = false;
            this.oidcSecurityCommon.logWarning('iat missing, validatation REQUIRED prorpeties in id_token');
        }
        return validated;
    };
    OidcSecurityValidation.prototype.validate_id_token_iat_max_offset = function (dataIdToken, max_offset_allowed_in_seconds) {
        if (!dataIdToken.hasOwnProperty('iat')) {
            return false;
        }
        var dateTime_iat_id_token = new Date(0);
        dateTime_iat_id_token.setUTCSeconds(dataIdToken.iat);
        max_offset_allowed_in_seconds = max_offset_allowed_in_seconds || 0;
        if (dateTime_iat_id_token == null) {
            return false;
        }
        this.oidcSecurityCommon.logDebug('validate_id_token_iat_max_offset: ' + (new Date().valueOf() - dateTime_iat_id_token.valueOf()) + ' < ' + (max_offset_allowed_in_seconds * 1000));
        return ((new Date().valueOf() - dateTime_iat_id_token.valueOf()) < (max_offset_allowed_in_seconds * 1000));
    };
    OidcSecurityValidation.prototype.validate_id_token_nonce = function (dataIdToken, local_nonce) {
        if (dataIdToken.nonce !== local_nonce) {
            this.oidcSecurityCommon.logDebug('Validate_id_token_nonce failed, dataIdToken.nonce: ' + dataIdToken.nonce + ' local_nonce:' + local_nonce);
            return false;
        }
        return true;
    };
    OidcSecurityValidation.prototype.validate_id_token_iss = function (dataIdToken, client_id) {
        if (dataIdToken.iss !== client_id) {
            this.oidcSecurityCommon.logDebug('Validate_id_token_iss failed, dataIdToken.iss: ' + dataIdToken.iss + ' client_id:' + client_id);
            return false;
        }
        return true;
    };
    OidcSecurityValidation.prototype.validate_id_token_aud = function (dataIdToken, aud) {
        if (dataIdToken.aud !== aud) {
            this.oidcSecurityCommon.logDebug('Validate_id_token_aud failed, dataIdToken.aud: ' + dataIdToken.aud + ' client_id:' + aud);
            return false;
        }
        return true;
    };
    OidcSecurityValidation.prototype.validateStateFromHashCallback = function (state, local_state) {
        if (state !== local_state) {
            this.oidcSecurityCommon.logDebug('ValidateStateFromHashCallback failed, state: ' + state + ' local_state:' + local_state);
            return false;
        }
        return true;
    };
    OidcSecurityValidation.prototype.getPayloadFromToken = function (token, encode) {
        var data = {};
        if (typeof token !== 'undefined') {
            var encoded = token.split('.')[1];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }
        return data;
    };
    OidcSecurityValidation.prototype.getHeaderFromToken = function (token, encode) {
        var data = {};
        if (typeof token !== 'undefined') {
            var encoded = token.split('.')[0];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }
        return data;
    };
    OidcSecurityValidation.prototype.getSignatureFromToken = function (token, encode) {
        var data = {};
        if (typeof token !== 'undefined') {
            var encoded = token.split('.')[2];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }
        return data;
    };
    OidcSecurityValidation.prototype.validate_signature_id_token = function (id_token, jwtkeys) {
        if (!jwtkeys || !jwtkeys.keys) {
            return false;
        }
        var header_data = this.getHeaderFromToken(id_token, false);
        var kid = header_data.kid;
        var alg = header_data.alg;
        if ('RS256' != alg) {
            this.oidcSecurityCommon.logWarning('Only RS256 supported');
            return false;
        }
        var isValid = false;
        for (var _i = 0, _a = jwtkeys.keys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (key.kid === kid) {
                var publickey = KEYUTIL.getKey(key);
                isValid = KJUR.jws.JWS.verify(id_token, publickey, ['RS256']);
                return isValid;
            }
        }
        return isValid;
    };
    OidcSecurityValidation.prototype.validate_id_token_at_hash = function (access_token, at_hash) {
        var hash = KJUR.crypto.Util.hashString(access_token, 'sha256');
        var first128bits = hash.substr(0, hash.length / 2);
        var testdata = hextob64u(first128bits);
        if (testdata === at_hash) {
            return true;
        }
        return false;
    };
    OidcSecurityValidation.prototype.getTokenExpirationDate = function (dataIdToken) {
        if (!dataIdToken.hasOwnProperty('exp')) {
            return null;
        }
        var date = new Date(0);
        date.setUTCSeconds(dataIdToken.exp);
        return date;
    };
    OidcSecurityValidation.prototype.urlBase64Decode = function (str) {
        var output = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw 'Illegal base64url string!';
        }
        return window.atob(output);
    };
    return OidcSecurityValidation;
}());
OidcSecurityValidation = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OidcSecurityCommon])
], OidcSecurityValidation);
export { OidcSecurityValidation };
//# sourceMappingURL=oidc.security.validation.js.map