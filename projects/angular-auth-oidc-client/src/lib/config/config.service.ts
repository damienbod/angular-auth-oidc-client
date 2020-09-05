import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigValidationService } from '../config-validation/config-validation.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { AuthWellKnownService } from './auth-well-known.service';
import { OpenIdConfiguration } from './openid-configuration';
import { PublicConfiguration } from './public-configuration';

@Injectable()
export class OidcConfigService {
    constructor(
        private readonly loggerService: LoggerService,
        private readonly publicEventsService: PublicEventsService,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly authWellKnownService: AuthWellKnownService,
        private storagePersistanceService: StoragePersistanceService,
        private configValidationService: ConfigValidationService
    ) {}

    withConfig(passedConfig: OpenIdConfiguration, passedAuthWellKnownEndpoints?: AuthWellKnownEndpoints): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.configValidationService.validateConfig(passedConfig)) {
                this.loggerService.logError('Validation of config rejected with errors. Config is NOT set.');
                return resolve();
            }

            if (!passedConfig.authWellknownEndpoint) {
                passedConfig.authWellknownEndpoint = passedConfig.stsServer;
            }

            const usedConfig = this.configurationProvider.setConfig(passedConfig);

            const alreadyExistingAuthWellKnownEndpoints = this.storagePersistanceService.read('authWellKnownEndPoints');
            if (!!alreadyExistingAuthWellKnownEndpoints) {
                this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
                    configuration: passedConfig,
                    wellknown: alreadyExistingAuthWellKnownEndpoints,
                });

                return resolve();
            }

            if (!!passedAuthWellKnownEndpoints) {
                this.authWellKnownService.storeWellKnownEndpoints(passedAuthWellKnownEndpoints);
                this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
                    configuration: passedConfig,
                    wellknown: passedAuthWellKnownEndpoints,
                });

                return resolve();
            }

            if (usedConfig.eagerLoadAuthWellKnownEndpoints) {
                this.authWellKnownService
                    .getAuthWellKnownEndPoints(usedConfig.authWellknownEndpoint)
                    .pipe(
                        catchError((error) => {
                            this.loggerService.logError('Getting auth well known endpoints failed on start', error);
                            return throwError(error);
                        }),
                        tap((wellknownEndPoints) =>
                            this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
                                configuration: passedConfig,
                                wellknown: wellknownEndPoints,
                            })
                        )
                    )
                    .subscribe(
                        () => resolve(),
                        () => reject()
                    );
            } else {
                this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
                    configuration: passedConfig,
                    wellknown: null,
                });
                resolve();
            }
        });
    }
}
