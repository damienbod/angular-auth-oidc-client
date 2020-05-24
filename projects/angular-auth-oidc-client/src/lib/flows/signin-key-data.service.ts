import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { JwtKeys } from '../validation/jwtkeys';

@Injectable()
export class SigninKeyDataService {
    constructor(
        private storagePesistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private dataService: DataService
    ) {}

    getSigningKeys() {
        const authWellKnownEndPoints = this.storagePesistanceService.read('authWellKnownEndPoints');
        const jwksUri = authWellKnownEndPoints?.jwksUri;
        if (!jwksUri) {
            const error = `getSigningKeys: authWellKnownEndpoints.jwksUri is: '${jwksUri}'`;
            this.loggerService.logWarning(error);
            return throwError(error);
        }

        this.loggerService.logDebug('Getting signinkeys from ', jwksUri);

        return this.dataService.get<JwtKeys>(jwksUri).pipe(catchError(this.handleErrorGetSigningKeys));
    }

    private handleErrorGetSigningKeys(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || {};
            const err = JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        this.loggerService.logError(errMsg);
        return throwError(errMsg);
    }
}
