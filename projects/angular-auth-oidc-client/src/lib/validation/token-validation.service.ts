import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { base64url } from 'rfc4648';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { CryptoService } from '../utils/crypto/crypto-service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { JwtWindowCryptoService } from './jwt-window-crypto.service';
import { JwkExtractor } from '../extractors/jwk.extractor';
import { JwkWindowCryptoService } from './jwk-window-crypto.service';

// http://openid.net/specs/openid-connect-implicit-1_0.html

// id_token
// id_token C1: The Issuer Identifier for the OpenID Provider (which is typically obtained during Discovery)
// MUST exactly match the value of the iss (issuer) Claim.
//
// id_token C2: The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified
// by the iss (issuer) Claim as an audience.The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience,
// or if it contains additional audiences not trusted by the Client.
//
// id_token C3: If the ID Token contains multiple audiences, the Client SHOULD verify that an azp Claim is present.
//
// id_token C4: If an azp (authorized party) Claim is present, the Client SHOULD verify that its client_id is the Claim Value.
//
// id_token C5: The Client MUST validate the signature of the ID Token according to JWS [JWS] using the algorithm specified in the
// alg Header Parameter of the JOSE Header.The Client MUST use the keys provided by the Issuer.
//
// id_token C6: The alg value SHOULD be RS256. Validation of tokens using other signing algorithms is described in the OpenID Connect
// Core 1.0
// [OpenID.Core] specification.
//
// id_token C7: The current time MUST be before the time represented by the exp Claim (possibly allowing for some small leeway to account
// for clock skew).
//
// id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
// limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
//
// id_token C9: The value of the nonce Claim MUST be checked to verify that it is the same value as the one that was sent
// in the Authentication Request.The Client SHOULD check the nonce value for replay attacks.The precise method for detecting replay attacks
// is Client specific.
//
// id_token C10: If the acr Claim was requested, the Client SHOULD check that the asserted Claim Value is appropriate.
// The meaning and processing of acr Claim Values is out of scope for this document.
//
// id_token C11: When a max_age request is made, the Client SHOULD check the auth_time Claim value and request re- authentication
// if it determines too much time has elapsed since the last End- User authentication.

// Access Token Validation
// access_token C1: Hash the octets of the ASCII representation of the access_token with the hash algorithm specified in JWA[JWA]
// for the alg Header Parameter of the ID Token's JOSE Header. For instance, if the alg is RS256, the hash algorithm used is SHA-256.
// access_token C2: Take the left- most half of the hash and base64url- encode it.
// access_token C3: The value of at_hash in the ID Token MUST match the value produced in the previous step if at_hash is present
// in the ID Token.

@Injectable()
export class TokenValidationService {
  static refreshTokenNoncePlaceholder = '--RefreshToken--';

  keyAlgorithms: string[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'PS256', 'PS384', 'PS512'];

  constructor(
    private readonly tokenHelperService: TokenHelperService,
    private readonly loggerService: LoggerService,
    private readonly jwkExtractor: JwkExtractor,
    private readonly jwkWindowCryptoService: JwkWindowCryptoService,
    private readonly jwtWindowCryptoService: JwtWindowCryptoService,
    private readonly cryptoService: CryptoService,
    @Inject(DOCUMENT) private readonly document: any
  ) {}

  // id_token C7: The current time MUST be before the time represented by the exp Claim
  // (possibly allowing for some small leeway to account for clock skew).
  hasIdTokenExpired(
    token: string,
    configuration: OpenIdConfiguration,
    offsetSeconds?: number,
    disableIdTokenValidation?: boolean
  ): boolean {
    const decoded = this.tokenHelperService.getPayloadFromToken(token, false, configuration);

    return !this.validateIdTokenExpNotExpired(decoded, configuration, offsetSeconds, disableIdTokenValidation);
  }

  // id_token C7: The current time MUST be before the time represented by the exp Claim
  // (possibly allowing for some small leeway to account for clock skew).
  validateIdTokenExpNotExpired(
    decodedIdToken: string,
    configuration: OpenIdConfiguration,
    offsetSeconds?: number,
    disableIdTokenValidation?: boolean
  ): boolean {
    if (disableIdTokenValidation) {
      return true;
    }

    const tokenExpirationDate = this.tokenHelperService.getTokenExpirationDate(decodedIdToken);

    offsetSeconds = offsetSeconds || 0;

    if (!tokenExpirationDate) {
      return false;
    }

    const tokenExpirationValue = tokenExpirationDate.valueOf();
    const nowWithOffset = this.calculateNowWithOffset(offsetSeconds);
    const tokenNotExpired = tokenExpirationValue > nowWithOffset;

    this.loggerService.logDebug(
      configuration,
      `Has idToken expired: ${!tokenNotExpired} --> expires in ${this.millisToMinutesAndSeconds(
        tokenExpirationValue - nowWithOffset
      )} , ${new Date(tokenExpirationValue).toLocaleTimeString()} > ${new Date(nowWithOffset).toLocaleTimeString()}`
    );

    return tokenNotExpired;
  }

  validateAccessTokenNotExpired(accessTokenExpiresAt: Date, configuration: OpenIdConfiguration, offsetSeconds?: number): boolean {
    // value is optional, so if it does not exist, then it has not expired
    if (!accessTokenExpiresAt) {
      return true;
    }

    offsetSeconds = offsetSeconds || 0;
    const accessTokenExpirationValue = accessTokenExpiresAt.valueOf();
    const nowWithOffset = this.calculateNowWithOffset(offsetSeconds);
    const tokenNotExpired = accessTokenExpirationValue > nowWithOffset;

    this.loggerService.logDebug(
      configuration,
      `Has accessToken expired: ${!tokenNotExpired} --> expires in ${this.millisToMinutesAndSeconds(
        accessTokenExpirationValue - nowWithOffset
      )} , ${new Date(accessTokenExpirationValue).toLocaleTimeString()} > ${new Date(nowWithOffset).toLocaleTimeString()}`
    );

    return tokenNotExpired;
  }

  // iss
  // REQUIRED. Issuer Identifier for the Issuer of the response.The iss value is a case-sensitive URL using the
  // https scheme that contains scheme, host,
  // and optionally, port number and path components and no query or fragment components.
  //
  // sub
  // REQUIRED. Subject Identifier.Locally unique and never reassigned identifier within the Issuer for the End- User,
  // which is intended to be consumed by the Client, e.g., 24400320 or AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4.
  // It MUST NOT exceed 255 ASCII characters in length.The sub value is a case-sensitive string.
  //
  // aud
  // REQUIRED. Audience(s) that this ID Token is intended for. It MUST contain the OAuth 2.0 client_id of the Relying Party as an
  // audience value.
  // It MAY also contain identifiers for other audiences.In the general case, the aud value is an array of case-sensitive strings.
  // In the common special case when there is one audience, the aud value MAY be a single case-sensitive string.
  //
  // exp
  // REQUIRED. Expiration time on or after which the ID Token MUST NOT be accepted for processing.
  // The processing of this parameter requires that the current date/ time MUST be before the expiration date/ time listed in the value.
  // Implementers MAY provide for some small leeway, usually no more than a few minutes, to account for clock skew.
  // Its value is a JSON [RFC7159] number representing the number of seconds from 1970- 01 - 01T00: 00:00Z as measured in UTC until
  // the date/ time.
  // See RFC 3339 [RFC3339] for details regarding date/ times in general and UTC in particular.
  //
  // iat
  // REQUIRED. Time at which the JWT was issued. Its value is a JSON number representing the number of seconds from
  // 1970- 01 - 01T00: 00: 00Z as measured
  // in UTC until the date/ time.
  validateRequiredIdToken(dataIdToken: any, configuration: OpenIdConfiguration): boolean {
    let validated = true;

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'iss')) {
      validated = false;
      this.loggerService.logWarning(configuration, 'iss is missing, this is required in the id_token');
    }

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'sub')) {
      validated = false;
      this.loggerService.logWarning(configuration, 'sub is missing, this is required in the id_token');
    }

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'aud')) {
      validated = false;
      this.loggerService.logWarning(configuration, 'aud is missing, this is required in the id_token');
    }

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'exp')) {
      validated = false;
      this.loggerService.logWarning(configuration, 'exp is missing, this is required in the id_token');
    }

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'iat')) {
      validated = false;
      this.loggerService.logWarning(configuration, 'iat is missing, this is required in the id_token');
    }

    return validated;
  }

  // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
  // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
  validateIdTokenIatMaxOffset(
    dataIdToken: any,
    maxOffsetAllowedInSeconds: number,
    disableIatOffsetValidation: boolean,
    configuration: OpenIdConfiguration
  ): boolean {
    if (disableIatOffsetValidation) {
      return true;
    }

    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'iat')) {
      return false;
    }

    const dateTimeIatIdToken = new Date(0); // The 0 here is the key, which sets the date to the epoch

    dateTimeIatIdToken.setUTCSeconds(dataIdToken.iat);
    maxOffsetAllowedInSeconds = maxOffsetAllowedInSeconds || 0;

    const nowInUtc = new Date(new Date().toUTCString());
    const diff = nowInUtc.valueOf() - dateTimeIatIdToken.valueOf();
    const maxOffsetAllowedInMilliseconds = maxOffsetAllowedInSeconds * 1000;

    this.loggerService.logDebug(configuration, `validate id token iat max offset ${diff} < ${maxOffsetAllowedInMilliseconds}`);

    if (diff > 0) {
      return diff < maxOffsetAllowedInMilliseconds;
    }

    return -diff < maxOffsetAllowedInMilliseconds;
  }

  // id_token C9: The value of the nonce Claim MUST be checked to verify that it is the same value as the one
  // that was sent in the Authentication Request.The Client SHOULD check the nonce value for replay attacks.
  // The precise method for detecting replay attacks is Client specific.

  // However the nonce claim SHOULD not be present for the refresh_token grant type
  // https://bitbucket.org/openid/connect/issues/1025/ambiguity-with-how-nonce-is-handled-on
  // The current spec is ambiguous and KeyCloak does send it.
  validateIdTokenNonce(dataIdToken: any, localNonce: any, ignoreNonceAfterRefresh: boolean, configuration: OpenIdConfiguration): boolean {
    const isFromRefreshToken =
      (dataIdToken.nonce === undefined || ignoreNonceAfterRefresh) && localNonce === TokenValidationService.refreshTokenNoncePlaceholder;

    if (!isFromRefreshToken && dataIdToken.nonce !== localNonce) {
      this.loggerService.logDebug(
        configuration,
        'Validate_id_token_nonce failed, dataIdToken.nonce: ' + dataIdToken.nonce + ' local_nonce:' + localNonce
      );

      return false;
    }

    return true;
  }

  // id_token C1: The Issuer Identifier for the OpenID Provider (which is typically obtained during Discovery)
  // MUST exactly match the value of the iss (issuer) Claim.
  validateIdTokenIss(dataIdToken: any, authWellKnownEndpointsIssuer: any, configuration: OpenIdConfiguration): boolean {
    if ((dataIdToken.iss as string) !== (authWellKnownEndpointsIssuer as string)) {
      this.loggerService.logDebug(
        configuration,
        'Validate_id_token_iss failed, dataIdToken.iss: ' +
          dataIdToken.iss +
          ' authWellKnownEndpoints issuer:' +
          authWellKnownEndpointsIssuer
      );

      return false;
    }

    return true;
  }

  // id_token C2: The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified
  // by the iss (issuer) Claim as an audience.
  // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences
  // not trusted by the Client.
  validateIdTokenAud(dataIdToken: any, aud: any, configuration: OpenIdConfiguration): boolean {
    if (Array.isArray(dataIdToken.aud)) {
      const result = dataIdToken.aud.includes(aud);

      if (!result) {
        this.loggerService.logDebug(
          configuration,
          'Validate_id_token_aud array failed, dataIdToken.aud: ' + dataIdToken.aud + ' client_id:' + aud
        );

        return false;
      }

      return true;
    } else if (dataIdToken.aud !== aud) {
      this.loggerService.logDebug(configuration, 'Validate_id_token_aud failed, dataIdToken.aud: ' + dataIdToken.aud + ' client_id:' + aud);

      return false;
    }

    return true;
  }

  validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken: any): boolean {
    if (!dataIdToken) {
      return false;
    }

    if (Array.isArray(dataIdToken.aud) && dataIdToken.aud.length > 1 && !dataIdToken.azp) {
      return false;
    }

    return true;
  }

  // If an azp (authorized party) Claim is present, the Client SHOULD verify that its client_id is the Claim Value.
  validateIdTokenAzpValid(dataIdToken: any, clientId: string): boolean {
    if (!dataIdToken?.azp) {
      return true;
    }

    if (dataIdToken.azp === clientId) {
      return true;
    }

    return false;
  }

  validateStateFromHashCallback(state: any, localState: any, configuration: OpenIdConfiguration): boolean {
    if ((state as string) !== (localState as string)) {
      this.loggerService.logDebug(configuration, 'ValidateStateFromHashCallback failed, state: ' + state + ' local_state:' + localState);

      return false;
    }

    return true;
  }

  // id_token C5: The Client MUST validate the signature of the ID Token according to JWS [JWS] using the algorithm specified in the alg
  // Header Parameter of the JOSE Header.The Client MUST use the keys provided by the Issuer.
  // id_token C6: The alg value SHOULD be RS256. Validation of tokens using other signing algorithms is described in the
  // OpenID Connect Core 1.0 [OpenID.Core] specification.
  validateSignatureIdToken(idToken: string, jwtkeys: any, configuration: OpenIdConfiguration): Observable<boolean> {
    if (!jwtkeys || !jwtkeys.keys) {
      return of(false);
    }

    const headerData = this.tokenHelperService.getHeaderFromToken(idToken, false, configuration);

    if (Object.keys(headerData).length === 0 && headerData.constructor === Object) {
      this.loggerService.logWarning(configuration, 'id token has no header data');

      return of(false);
    }

    const kid: string = headerData.kid;
    let alg: string = headerData.alg;

    let keys: JsonWebKey[] = jwtkeys.keys;
    let foundKeys: JsonWebKey[];
    let key: JsonWebKey;

    if (!this.keyAlgorithms.includes(alg)) {
      this.loggerService.logWarning(configuration, 'alg not supported', alg);

      return of(false);
    }

    const kty = this.alg2kty(alg);
    const use = 'sig';

    try {
      foundKeys = kid ?
        this.jwkExtractor.extractJwk(keys, {kid, kty, use}, false) :
        this.jwkExtractor.extractJwk(keys, {kty, use}, false);

      if (foundKeys.length === 0) {
        foundKeys = kid ?
          this.jwkExtractor.extractJwk(keys, {kid, kty}) :
          this.jwkExtractor.extractJwk(keys, {kty});
      }

      key = foundKeys[0];
    } catch (e: any) {
      this.loggerService.logError(configuration, e);

      return of(false);
    }

    const algorithm: RsaHashedImportParams | EcKeyImportParams = this.getImportAlg(alg);

    const signingInput = this.tokenHelperService.getSigningInputFromToken(idToken, true, configuration);
    const rawSignature = this.tokenHelperService.getSignatureFromToken(idToken, true, configuration);

    const agent: string = this.document.defaultView.navigator.userAgent.toLowerCase();

    if (agent.indexOf('firefox') > -1 && key.kty === 'EC') {
      key.alg = '';
    }

    return from(this.jwkWindowCryptoService.importVerificationKey(key, algorithm)).pipe(
      mergeMap((cryptoKey: CryptoKey) => {
        const signature: Uint8Array = base64url.parse(rawSignature, { loose: true });

        const verifyAlgorithm: RsaHashedImportParams | EcdsaParams = this.getVerifyAlg(alg);

        return from(this.jwkWindowCryptoService.verifyKey(verifyAlgorithm, cryptoKey, signature, signingInput));
      }),
      tap((isValid: boolean) => {
        if (!isValid) {
          this.loggerService.logWarning(configuration, 'incorrect Signature, validation failed for id_token');
        }
      })
    );
  }

  private getImportAlg(alg: string): RsaHashedImportParams | EcKeyImportParams {
    switch (alg.charAt(0)) {
      case 'R':
        if (alg.includes('256')) {
          return {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
          };
        } else if (alg.includes('384')) {
          return {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-384',
          };
        } else if (alg.includes('512')) {
          return {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-512',
          };
        } else {
          return null;
        }
      case 'E':
        if (alg.includes('256')) {
          return {
            name: 'ECDSA',
            namedCurve: 'P-256',
          };
        } else if (alg.includes('384')) {
          return {
            name: 'ECDSA',
            namedCurve: 'P-384',
          };
        } else {
          return null;
        }
      default:
        return null;
    }
  }

  private getVerifyAlg(alg: string): RsaHashedImportParams | EcdsaParams {
    switch (alg.charAt(0)) {
      case 'R':
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        };
      case 'E':
        if (alg.includes('256')) {
          return {
            name: 'ECDSA',
            hash: 'SHA-256',
          };
        } else if (alg.includes('384')) {
          return {
            name: 'ECDSA',
            hash: 'SHA-384',
          };
        } else {
          return null;
        }
      default:
        return null;
    }
  }

  private alg2kty(alg: string): string {
    switch (alg.charAt(0)) {
      case 'R':
        return 'RSA';

      case 'E':
        return 'EC';

      default:
        throw new Error('Cannot infer kty from alg: ' + alg);
    }
  }

  // Accepts ID Token without 'kid' claim in JOSE header if only one JWK supplied in 'jwks_url'
  //// private validate_no_kid_in_header_only_one_allowed_in_jwtkeys(header_data: any, jwtkeys: any): boolean {
  ////    this.oidcSecurityCommon.logDebug('amount of jwtkeys.keys: ' + jwtkeys.keys.length);
  ////    if (!header_data.hasOwnProperty('kid')) {
  ////        // no kid defined in Jose header
  ////        if (jwtkeys.keys.length != 1) {
  ////            this.oidcSecurityCommon.logDebug('jwtkeys.keys.length != 1 and no kid in header');
  ////            return false;
  ////        }
  ////    }

  ////    return true;
  //// }

  // Access Token Validation
  // access_token C1: Hash the octets of the ASCII representation of the access_token with the hash algorithm specified in JWA[JWA]
  // for the alg Header Parameter of the ID Token's JOSE Header. For instance, if the alg is RS256, the hash algorithm used is SHA-256.
  // access_token C2: Take the left- most half of the hash and base64url- encode it.
  // access_token C3: The value of at_hash in the ID Token MUST match the value produced in the previous step if at_hash
  // is present in the ID Token.
  validateIdTokenAtHash(accessToken: string, atHash: string, idTokenAlg: string, configuration: OpenIdConfiguration): Observable<boolean> {
    this.loggerService.logDebug(configuration, 'at_hash from the server:' + atHash);

    // 'sha256' 'sha384' 'sha512'
    let sha = 'SHA-256';

    if (idTokenAlg.includes('384')) {
      sha = 'SHA-384';
    } else if (idTokenAlg.includes('512')) {
      sha = 'SHA-512';
    }

    return this.jwtWindowCryptoService.generateAtHash('' + accessToken, sha).pipe(
      mergeMap((hash: string) => {
        this.loggerService.logDebug(configuration, 'at_hash client validation not decoded:' + hash);
        if (hash === atHash) {
          return of(true); // isValid;
        } else {
          return this.jwtWindowCryptoService.generateAtHash('' + decodeURIComponent(accessToken), sha).pipe(
            map((newHash: string) => {
              this.loggerService.logDebug(configuration, '-gen access--' + hash);

              return newHash === atHash;
            })
          );
        }
      })
    );
  }

  private millisToMinutesAndSeconds(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);

    return minutes + ':' + (+seconds < 10 ? '0' : '') + seconds;
  }

  private calculateNowWithOffset(offsetSeconds: number): number {
    return new Date(new Date().toUTCString()).valueOf() + offsetSeconds * 1000;
  }
}
