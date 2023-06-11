import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { JwtKeys } from '../validation/jwtkeys';

@Injectable({ providedIn: 'root' })
export class SigninKeyDataService {
  constructor(
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly loggerService: LoggerService,
    private readonly dataService: DataService
  ) {}

  getSigningKeys(
    currentConfiguration: OpenIdConfiguration
  ): Observable<JwtKeys> {
    const authWellKnownEndPoints = this.storagePersistenceService.read(
      'authWellKnownEndPoints',
      currentConfiguration
    );
    const jwksUri = authWellKnownEndPoints?.jwksUri;

    if (!jwksUri) {
      const error = `getSigningKeys: authWellKnownEndpoints.jwksUri is: '${jwksUri}'`;

      this.loggerService.logWarning(currentConfiguration, error);

      return throwError(() => new Error(error));
    }

    this.loggerService.logDebug(
      currentConfiguration,
      'Getting signinkeys from ',
      jwksUri
    );

    return this.dataService.get<JwtKeys>(jwksUri, currentConfiguration).pipe(
      retry(2),
      catchError((e) => this.handleErrorGetSigningKeys(e, currentConfiguration))
    );
  }

  private handleErrorGetSigningKeys(
    errorResponse: HttpResponse<any> | any,
    currentConfiguration: OpenIdConfiguration
  ): Observable<never> {
    let errMsg = '';

    if (errorResponse instanceof HttpResponse) {
      const body = errorResponse.body || {};
      const err = JSON.stringify(body);
      const { status, statusText } = errorResponse;

      errMsg = `${status || ''} - ${statusText || ''} ${err || ''}`;
    } else {
      const { message } = errorResponse;

      errMsg = !!message ? message : `${errorResponse}`;
    }
    this.loggerService.logError(currentConfiguration, errMsg);

    return throwError(() => new Error(errMsg));
  }
}
