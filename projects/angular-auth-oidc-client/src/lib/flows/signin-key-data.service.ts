import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { JwtKeys } from '../validation/jwtkeys';

@Injectable()
export class SigninKeyDataService {
  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private loggerService: LoggerService,
    private dataService: DataService
  ) {}

  getSigningKeys(configId: string) {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const jwksUri = authWellKnownEndPoints?.jwksUri;
    if (!jwksUri) {
      const error = `getSigningKeys: authWellKnownEndpoints.jwksUri is: '${jwksUri}'`;
      this.loggerService.logWarning(configId, error);
      return throwError(error);
    }

    this.loggerService.logDebug('Getting signinkeys from ', jwksUri);

    return this.dataService.get<JwtKeys>(jwksUri, configId, null).pipe(
      retry(2),
      catchError((e) => this.handleErrorGetSigningKeys(e, configId))
    );
  }

  private handleErrorGetSigningKeys(errorResponse: HttpResponse<any> | any, configId: string) {
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
    this.loggerService.logError(configId, errMsg);
    return throwError(errMsg);
  }
}
