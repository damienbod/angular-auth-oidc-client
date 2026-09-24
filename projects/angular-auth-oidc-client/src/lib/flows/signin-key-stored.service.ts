import { inject, Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { OpenIdConfiguration } from "../config/openid-configuration";
import { JwkExtractor } from "../extractors/jwk.extractor";
import { StoragePersistenceService } from "../storage/storage-persistence.service";
import { TokenHelperService } from "../utils/tokenHelper/token-helper.service";
import { JwtKeys } from "../validation/jwtkeys";

const JWT_KEYS = 'jwtKeys';

@Injectable({ providedIn: 'root' })
export class SigninKeyStoredService {
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly tokenHelperService = inject(TokenHelperService);
  private readonly jwkExtractor = inject(JwkExtractor);

  getSigningKeys(
    token: string | undefined,
    config: OpenIdConfiguration
  ): Observable<JwtKeys> {
    if (!token) {
      return throwError(() => new Error('Token is missing'));
    }

    const storedJwtKeys = this.readSigningKeys(config);

    if (!storedJwtKeys) {
      return throwError(() => new Error('No stored signing keys'));
    }

    try {
      const headerData = this.tokenHelperService.getHeaderFromToken(
        token,
        false,
        config
      );

      this.jwkExtractor.extractJwk(
        storedJwtKeys.keys,
        { kid: headerData.kid },
        true
      );

      return of(storedJwtKeys);
    } catch {
      return throwError(() => new Error('No matching stored signing key'));
    }
  }

  storeSigningKeys(
    jwtKeys: JwtKeys,
    config: OpenIdConfiguration
  ): void {
    this.storagePersistenceService.write(JWT_KEYS, jwtKeys, config);
  }

  readSigningKeys(
    config: OpenIdConfiguration
  ): JwtKeys | null {
    return this.storagePersistenceService.read(
      JWT_KEYS,
      config
    );
  }
}