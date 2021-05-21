// import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { TestBed, waitForAsync } from '@angular/core/testing';
// import { of, throwError } from 'rxjs';
// import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
// import { DataService } from '../../api/data.service';
// import { DataServiceMock } from '../../api/data.service-mock';
// import { ConfigurationProvider } from '../../config/config.provider';
// import { ConfigurationProviderMock } from '../../config/provider/config.provider-mock';
// import { LoggerService } from '../../logging/logger.service';
// import { LoggerServiceMock } from '../../logging/logger.service-mock';
// import { StoragePersistenceServiceMock } from '../../storage/storage-persistence-service-mock.service';
// import { StoragePersistenceService } from '../../storage/storage-persistence.service';
// import { UrlService } from '../../utils/url/url.service';
// import { UrlServiceMock } from '../../utils/url/url.service-mock';
// import { TokenValidationService } from '../../validation/token-validation.service';
// import { TokenValidationServiceMock } from '../../validation/token-validation.service-mock';
// import { CallbackContext } from '../callback-context';
// import { FlowsDataService } from '../flows-data.service';
// import { FlowsDataServiceMock } from '../flows-data.service-mock';
// import { CodeFlowCallbackHandlerService } from './code-flow-callback-handler.service';

// describe('CodeFlowCallbackHandlerService', () => {
//   let service: CodeFlowCallbackHandlerService;
//   let dataService: DataService;
//   let storagePersistenceService: StoragePersistenceService;
//   let tokenValidationService: TokenValidationService;
//   let configurationProvider: ConfigurationProvider;
//   let urlService: UrlService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         CodeFlowCallbackHandlerService,
//         { provide: UrlService, useClass: UrlServiceMock },
//         { provide: LoggerService, useClass: LoggerServiceMock },
//         { provide: TokenValidationService, useClass: TokenValidationServiceMock },
//         { provide: FlowsDataService, useClass: FlowsDataServiceMock },
//         { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
//         { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
//         { provide: DataService, useClass: DataServiceMock },
//       ],
//     });
//   });

//   beforeEach(() => {
//     service = TestBed.inject(CodeFlowCallbackHandlerService);
//     dataService = TestBed.inject(DataService);
//     urlService = TestBed.inject(UrlService);
//     configurationProvider = TestBed.inject(ConfigurationProvider);
//     storagePersistenceService = TestBed.inject(StoragePersistenceService);
//     tokenValidationService = TestBed.inject(TokenValidationService);
//   });

//   it('should create', () => {
//     expect(service).toBeTruthy();
//   });

//   describe('codeFlowCallback', () => {
//     it(
//       'throws error if no state is given',
//       waitForAsync(() => {
//         const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
//         getUrlParameterSpy.withArgs('any-url', 'state').and.returnValue(null);

//         service.codeFlowCallback('any-url').subscribe({
//           error: (err) => {
//             expect(err).toBeTruthy();
//           },
//         });
//       })
//     );

//     it(
//       'throws error if no code is given',
//       waitForAsync(() => {
//         const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
//         getUrlParameterSpy.withArgs('any-url', 'code').and.returnValue(null);

//         service.codeFlowCallback('any-url').subscribe({
//           error: (err) => {
//             expect(err).toBeTruthy();
//           },
//         });
//       })
//     );

//     it(
//       'returns callbackContext if all params are good',
//       waitForAsync(() => {
//         spyOn(urlService, 'getUrlParameter').and.returnValue('params');

//         const expectedCallbackContext = {
//           code: 'params',
//           refreshToken: null,
//           state: 'params',
//           sessionState: 'params',
//           authResult: null,
//           isRenewProcess: false,
//           jwtKeys: null,
//           validationResult: null,
//           existingIdToken: null,
//         };

//         service.codeFlowCallback('any-url').subscribe((callbackContext) => {
//           expect(callbackContext).toEqual(expectedCallbackContext);
//         });
//       })
//     );
//   });

//   describe('codeFlowCodeRequest ', () => {
//     const HTTP_ERROR = new HttpErrorResponse({});
//     const CONNECTION_ERROR = new HttpErrorResponse({
//       error: new ProgressEvent('error'),
//       status: 0,
//       statusText: 'Unknown Error',
//       url: 'https://identity-server.test/openid-connect/token',
//     });

//     it(
//       'throws error if state is not correct',
//       waitForAsync(() => {
//         spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(false);

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe({
//           error: (err) => {
//             expect(err).toBeTruthy();
//           },
//         });
//       })
//     );

//     it(
//       'throws error if no tokenEndpoint is given',
//       waitForAsync(() => {
//         service.codeFlowCodeRequest({} as CallbackContext).subscribe({
//           error: (err) => {
//             expect(err).toBeTruthy();
//           },
//         });
//       })
//     );

//     it(
//       'calls dataService if all params are good',
//       waitForAsync(() => {
//         const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe((callbackContext) => {
//           expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
//         });
//       })
//     );

//     it(
//       'calls url service with custom token params',
//       waitForAsync(() => {
//         const urlServiceSpy = spyOn(urlService, 'createBodyForCodeFlowCodeRequest');
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

//         const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
//         spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ customTokenParams: { foo: 'bar' } });

//         service.codeFlowCodeRequest({ code: 'foo' } as CallbackContext).subscribe((callbackContext) => {
//           expect(urlServiceSpy).toHaveBeenCalledWith('foo', { foo: 'bar' });
//           expect(postSpy).toHaveBeenCalledTimes(1);
//         });
//       })
//     );

//     it(
//       'calls dataService with correct headers if all params are good',
//       waitForAsync(() => {
//         const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe((callbackContext) => {
//           const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
//           expect(httpHeaders.has('Content-Type')).toBeTrue();
//           expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
//         });
//       })
//     );

//     it(
//       'returns error in case of http error',
//       waitForAsync(() => {
//         spyOn(dataService, 'post').and.returnValue(throwError(HTTP_ERROR));
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
//         spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe({
//           error: (err) => {
//             expect(err).toBeTruthy();
//           },
//         });
//       })
//     );

//     it(
//       'retries request in case of no connection http error and succeeds',
//       waitForAsync(() => {
//         const postSpy = spyOn(dataService, 'post').and.returnValue(createRetriableStream(throwError(CONNECTION_ERROR), of({})));
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
//         spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe({
//           next: (res) => {
//             expect(res).toBeTruthy();
//             expect(postSpy).toHaveBeenCalledTimes(1);
//           },
//           error: (err) => {
//             // fails if there should be a result
//             expect(err).toBeFalsy();
//           },
//         });
//       })
//     );

//     it(
//       'retries request in case of no connection http error and fails because of http error afterwards',
//       waitForAsync(() => {
//         const postSpy = spyOn(dataService, 'post').and.returnValue(
//           createRetriableStream(throwError(CONNECTION_ERROR), throwError(HTTP_ERROR))
//         );
//         spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
//         spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });

//         service.codeFlowCodeRequest({} as CallbackContext).subscribe({
//           next: (res) => {
//             // fails if there should be a result
//             expect(res).toBeFalsy();
//           },
//           error: (err) => {
//             expect(err).toBeTruthy();
//             expect(postSpy).toHaveBeenCalledTimes(1);
//           },
//         });
//       })
//     );
//   });
// });
