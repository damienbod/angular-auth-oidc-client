// import { TestBed, waitForAsync } from '@angular/core/testing';
// import { of } from 'rxjs';
// import { CallbackContext } from './callback-context';
// import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
// import { CodeFlowCallbackHandlerServiceMock } from './callback-handling/code-flow-callback-handler.service-mock';
// import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
// import { HistoryJwtKeysCallbackHandlerServiceMock } from './callback-handling/history-jwt-keys-callback-handler.service-mock';
// import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
// import { ImplicitFlowCallbackHandlerServiceMock } from './callback-handling/implicit-flow-callback-handler.service.mock';
// import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
// import { RefreshSessionCallbackHandlerServiceMock } from './callback-handling/refresh-session-callback-handler.service-mock';
// import { RefreshTokenCallbackHandlerService } from './callback-handling/refresh-token-callback-handler.service';
// import { RefreshTokenCallbackHandlerServiceMock } from './callback-handling/refresh-token-callback-handler.service-mock';
// import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
// import { StateValidationCallbackHandlerServiceMock } from './callback-handling/state-validation-callback-handler.service-mock';
// import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';
// import { UserCallbackHandlerServiceMock } from './callback-handling/user-callback-handler.service-mock';
// import { FlowsService } from './flows.service';

// describe('Flows Service', () => {
//   let service: FlowsService;
//   let codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService;
//   let implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService;
//   let historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService;
//   let userCallbackHandlerService: UserCallbackHandlerService;
//   let stateValidationCallbackHandlerService: StateValidationCallbackHandlerService;
//   let refreshSessionCallbackHandlerService: RefreshSessionCallbackHandlerService;
//   let refreshTokenCallbackHandlerService: RefreshTokenCallbackHandlerService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         FlowsService,
//         { provide: CodeFlowCallbackHandlerService, useClass: CodeFlowCallbackHandlerServiceMock },
//         { provide: ImplicitFlowCallbackHandlerService, useClass: ImplicitFlowCallbackHandlerServiceMock },
//         { provide: HistoryJwtKeysCallbackHandlerService, useClass: HistoryJwtKeysCallbackHandlerServiceMock },
//         { provide: UserCallbackHandlerService, useClass: UserCallbackHandlerServiceMock },
//         { provide: StateValidationCallbackHandlerService, useClass: StateValidationCallbackHandlerServiceMock },
//         { provide: RefreshSessionCallbackHandlerService, useClass: RefreshSessionCallbackHandlerServiceMock },
//         { provide: RefreshTokenCallbackHandlerService, useClass: RefreshTokenCallbackHandlerServiceMock },
//       ],
//     });
//   });

//   beforeEach(() => {
//     service = TestBed.inject(FlowsService);
//     codeFlowCallbackHandlerService = TestBed.inject(CodeFlowCallbackHandlerService);
//     implicitFlowCallbackHandlerService = TestBed.inject(ImplicitFlowCallbackHandlerService);
//     historyJwtKeysCallbackHandlerService = TestBed.inject(HistoryJwtKeysCallbackHandlerService);
//     userCallbackHandlerService = TestBed.inject(UserCallbackHandlerService);
//     stateValidationCallbackHandlerService = TestBed.inject(StateValidationCallbackHandlerService);
//     refreshSessionCallbackHandlerService = TestBed.inject(RefreshSessionCallbackHandlerService);
//     refreshTokenCallbackHandlerService = TestBed.inject(RefreshTokenCallbackHandlerService);
//   });

//   it('should create', () => {
//     expect(service).toBeTruthy();
//   });

//   describe('processCodeFlowCallback', () => {
//     it(
//       'calls all methods correctly',
//       waitForAsync(() => {
//         const codeFlowCallbackSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCallback').and.returnValue(of(null));
//         const codeFlowCodeRequestSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest').and.returnValue(of(null));
//         const callbackHistoryAndResetJwtKeysSpy = spyOn(
//           historyJwtKeysCallbackHandlerService,
//           'callbackHistoryAndResetJwtKeys'
//         ).and.returnValue(of(null));
//         const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
//           of(null)
//         );
//         const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

//         service.processCodeFlowCallback('some-url1234').subscribe((value) => {
//           expect(value).toBeNull();
//           expect(codeFlowCallbackSpy).toHaveBeenCalledOnceWith('some-url1234');
//           expect(codeFlowCodeRequestSpy).toHaveBeenCalledTimes(1);
//           expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalledTimes(1);
//           expect(callbackStateValidationSpy).toHaveBeenCalledTimes(1);
//           expect(callbackUserSpy).toHaveBeenCalledTimes(1);
//         });
//       })
//     );
//   });

//   describe('processSilentRenewCodeFlowCallback', () => {
//     it(
//       'calls all methods correctly',
//       waitForAsync(() => {
//         const codeFlowCodeRequestSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest').and.returnValue(of(null));
//         const callbackHistoryAndResetJwtKeysSpy = spyOn(
//           historyJwtKeysCallbackHandlerService,
//           'callbackHistoryAndResetJwtKeys'
//         ).and.returnValue(of(null));
//         const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
//           of(null)
//         );
//         const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

//         service.processSilentRenewCodeFlowCallback({} as CallbackContext).subscribe((value) => {
//           expect(value).toBeNull();
//           expect(codeFlowCodeRequestSpy).toHaveBeenCalled();
//           expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
//           expect(callbackStateValidationSpy).toHaveBeenCalled();
//           expect(callbackUserSpy).toHaveBeenCalled();
//         });
//       })
//     );
//   });

//   describe('processImplicitFlowCallback', () => {
//     it(
//       'calls all methods correctly',
//       waitForAsync(() => {
//         const implicitFlowCallbackSpy = spyOn(implicitFlowCallbackHandlerService, 'implicitFlowCallback').and.returnValue(of(null));
//         const callbackHistoryAndResetJwtKeysSpy = spyOn(
//           historyJwtKeysCallbackHandlerService,
//           'callbackHistoryAndResetJwtKeys'
//         ).and.returnValue(of(null));
//         const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
//           of(null)
//         );
//         const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

//         (service as any).processImplicitFlowCallback('any-hash').subscribe((value) => {
//           expect(value).toBeNull();
//           expect(implicitFlowCallbackSpy).toHaveBeenCalled();
//           expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
//           expect(callbackStateValidationSpy).toHaveBeenCalled();
//           expect(callbackUserSpy).toHaveBeenCalled();
//         });
//       })
//     );
//   });

//   describe('processRefreshToken', () => {
//     it(
//       'calls all methods correctly',
//       waitForAsync(() => {
//         const refreshSessionWithRefreshTokensSpy = spyOn(
//           refreshSessionCallbackHandlerService,
//           'refreshSessionWithRefreshTokens'
//         ).and.returnValue(of(null));
//         const refreshTokensRequestTokensSpy = spyOn(refreshTokenCallbackHandlerService, 'refreshTokensRequestTokens').and.returnValue(
//           of(null)
//         );
//         const callbackHistoryAndResetJwtKeysSpy = spyOn(
//           historyJwtKeysCallbackHandlerService,
//           'callbackHistoryAndResetJwtKeys'
//         ).and.returnValue(of(null));
//         const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
//           of(null)
//         );
//         const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

//         (service as any).processRefreshToken().subscribe((value) => {
//           expect(value).toBeNull();
//           expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
//           expect(refreshTokensRequestTokensSpy).toHaveBeenCalled();
//           expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
//           expect(callbackStateValidationSpy).toHaveBeenCalled();
//           expect(callbackUserSpy).toHaveBeenCalled();
//         });
//       })
//     );
//   });
// });
