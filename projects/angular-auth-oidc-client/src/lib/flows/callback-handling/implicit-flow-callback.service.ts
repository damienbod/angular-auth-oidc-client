// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { DataService } from '../../api/data.service';
// import { ConfigurationProvider } from '../../config/config.provider';
// import { LoggerService } from '../../logging/logger.service';
// import { StoragePersistanceService } from '../../storage/storage-persistance.service';
// import { UrlService } from '../../utils/url/url.service';
// import { TokenValidationService } from '../../validation/token-validation.service';
// import { CallbackContext } from '../callback-context';
// import { FlowsDataService } from '../flows-data.service';

// @Injectable()
// export class ImplicitFlowCallbackService {
//   constructor(
//     private readonly urlService: UrlService,
//     private readonly loggerService: LoggerService,
//     private readonly tokenValidationService: TokenValidationService,
//     private readonly flowsDataService: FlowsDataService,
//     private readonly configurationProvider: ConfigurationProvider,
//     private readonly storagePersistanceService: StoragePersistanceService,
//     private readonly dataService: DataService
//   ) {}

//   // STEP 1 Code Flow
//   // STEP 1 Implicit Flow
//   implicitFlowCallback(hash?: string): Observable<CallbackContext> {
//     const isRenewProcessData = this.flowsDataService.isSilentRenewRunning();

//     this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
//     if (!isRenewProcessData) {
//       this.resetAuthorizationData();
//     }

//     hash = hash || window.location.hash.substr(1);

//     const authResult: any = hash.split('&').reduce((resultData: any, item: string) => {
//       const parts = item.split('=');
//       resultData[parts.shift() as string] = parts.join('=');
//       return resultData;
//     }, {});

//     const callbackContext = {
//       code: null,
//       refreshToken: null,
//       state: null,
//       sessionState: null,
//       authResult,
//       isRenewProcess: isRenewProcessData,
//       jwtKeys: null,
//       validationResult: null,
//       existingIdToken: null,
//     };

//     return of(callbackContext);
//   }
// }
