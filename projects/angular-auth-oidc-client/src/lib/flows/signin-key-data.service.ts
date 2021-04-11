import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { JwtKeys } from '../validation/jwtkeys';

@Injectable()
export class SigninKeyDataService {
  constructor(
    private storagePersistanceService: StoragePersistanceService,
    private loggerService: LoggerService,
    private dataService: DataService
  ) {}

  getSigningKeys() {
    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    const jwksUri = authWellKnownEndPoints?.jwksUri;
    if (!jwksUri) {
      const error = `getSigningKeys: authWellKnownEndpoints.jwksUri is: '${jwksUri}'`;
      this.loggerService.logWarning(error);
      return throwError(error);
    }

    this.loggerService.logDebug('Getting signinkeys from ', jwksUri);

    return this.dataService.get<JwtKeys>(jwksUri).pipe(retry(2), catchError(this.handleErrorGetSigningKeys));
  }

  private handleErrorGetSigningKeys(errorResponse: HttpResponse<any> | any) {
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
    this.loggerService.logError(errMsg);
    return throwError(new Error(errMsg));
  }
}
