import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { JwtKeys } from '../validation/jwtkeys';

@Injectable()
export class SigninKeyDataService {
    constructor(
        private configurationProvider: ConfigurationProvider,
        private loggerService: LoggerService,
        private dataService: DataService
    ) {}

    getSigningKeys() {
        if (!this.configurationProvider.wellKnownEndpoints?.jwksUri) {
            const error = `getSigningKeys: authWellKnownEndpoints.jwksUri is: '${this.configurationProvider.wellKnownEndpoints?.jwksUri}'`;
            this.loggerService.logWarning(error);
            return throwError(error);
        }

        this.loggerService.logDebug('Getting signinkeys from ', this.configurationProvider.wellKnownEndpoints.jwksUri);

        return this.dataService
            .get<JwtKeys>(this.configurationProvider.wellKnownEndpoints.jwksUri)
            .pipe(catchError(this.handleErrorGetSigningKeys));
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
