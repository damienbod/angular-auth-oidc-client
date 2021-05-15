import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of, throwError, TimeoutError } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../config/auth-well-known/auth-well-known.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.service-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { RefreshSessionIframeServiceMock } from '../iframe/refresh-session-iframe.service-mock';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { SilentRenewServiceMock } from '../iframe/silent-renew.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';
import { RefreshSessionRefreshTokenServiceMock } from './refresh-session-refresh-token.service-mock';
import { MAX_RETRY_ATTEMPTS, RefreshSessionService } from './refresh-session.service';

describe('RefreshSessionService ', () => {
  let refreshSessionService: RefreshSessionService;
  let configurationProvider: ConfigurationProvider;
  let flowsDataService: FlowsDataService;
  let flowHelper: FlowHelper;
  let authStateService: AuthStateService;
  let refreshSessionIframeService: RefreshSessionIframeService;
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let silentRenewService: SilentRenewService;
  let authWellKnownService: AuthWellKnownService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        RefreshSessionService,
        FlowHelper,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: SilentRenewService, useClass: SilentRenewServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
        { provide: FlowsService, useClass: FlowsServiceMock },
        {
          provide: RefreshSessionIframeService,
          useClass: RefreshSessionIframeServiceMock,
        },
        {
          provide: RefreshSessionRefreshTokenService,
          useClass: RefreshSessionRefreshTokenServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    refreshSessionService = TestBed.inject(RefreshSessionService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowHelper = TestBed.inject(FlowHelper);
    authStateService = TestBed.inject(AuthStateService);
    refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
    refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
    silentRenewService = TestBed.inject(SilentRenewService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
  });

  it('should create', () => {
    expect(refreshSessionService).toBeTruthy();
  });

  describe('forceRefreshSession', () => {
    it(
      'only calls start refresh session and returns idToken and accessToken if auth is true',
      waitForAsync(() => {
        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
        spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });

        refreshSessionService.forceRefreshSession().subscribe((result) => {
          expect(result.idToken).not.toBeUndefined();
          expect(result.accessToken).not.toBeUndefined();
        });
      })
    );

    it(
      'only calls start refresh session and returns null if auth is false',
      waitForAsync(() => {
        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
        spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });

        refreshSessionService.forceRefreshSession().subscribe((result) => {
          expect(result).toBeNull();
        });
      })
    );

    it(
      'calls start refresh session and waits for completed, returns idtoken and accesstoken if auth is true',
      waitForAsync(() => {
        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
        spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });

        refreshSessionService.forceRefreshSession().subscribe((result) => {
          expect(result.idToken).toBeDefined();
          expect(result.accessToken).toBeDefined();
        });

        (silentRenewService as any).fireRefreshWithIframeCompleted({
          authResult: { id_token: 'id_token', access_token: 'access_token' },
        });
      })
    );

    it(
      'calls start refresh session and waits for completed, returns null if auth is false',
      waitForAsync(() => {
        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
        spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });

        refreshSessionService.forceRefreshSession().subscribe((result) => {
          expect(result).toBeNull();
        });

        (silentRenewService as any).fireRefreshWithIframeCompleted({
          authResult: { id_token: 'id_token', access_token: 'access_token' },
        });
      })
    );

    it('occurs timeout error and retry mechanism exhausted max retry count throws error', fakeAsync(() => {
      const openIDConfiguration = {
        silentRenewTimeoutInSeconds: 10,
      };

      spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
      spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(openIDConfiguration);

      const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
      const expectedInvokeCount = MAX_RETRY_ATTEMPTS;

      refreshSessionService.forceRefreshSession().subscribe(
        () => {
          fail('It should not return any result.');
        },
        (error) => {
          expect(error).toBeInstanceOf(TimeoutError);
          expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(expectedInvokeCount);
        }
      );

      tick(openIDConfiguration.silentRenewTimeoutInSeconds * 10000);
    }));

    it('occurs unknown error throws it to subscriber', fakeAsync(() => {
      const openIDConfiguration = {
        silentRenewTimeoutInSeconds: 10,
      };

      const expectedErrorMessage = 'Test error message';

      spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
      spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(throwError(new Error(expectedErrorMessage)));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(openIDConfiguration);

      const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');

      refreshSessionService.forceRefreshSession().subscribe(
        () => {
          fail('It should not return any result.');
        },
        (error) => {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message === expectedErrorMessage).toBeTruthy();
          expect(resetSilentRenewRunningSpy).not.toHaveBeenCalled();
        }
      );
    }));

    describe('NOT isCurrentFlowCodeFlowWithRefreshTokens', () => {
      it(
        'does return null when not authenticated',
        waitForAsync(() => {
          spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
          spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
          spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
          spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });

          refreshSessionService.forceRefreshSession().subscribe((result) => {
            expect(result).toBeNull();
          });

          (silentRenewService as any).fireRefreshWithIframeCompleted({
            authResult: { id_token: 'id_token', access_token: 'access_token' },
          });
        })
      );

      it(
        'return value only returns once',
        waitForAsync(() => {
          spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
          spyOn(refreshSessionService as any, 'startRefreshSession').and.returnValue(of(null));
          spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ silentRenewTimeoutInSeconds: 10 });
          const spyInsideMap = spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

          refreshSessionService
            .forceRefreshSession()
            .toPromise()
            .then((result) => expect(result).toEqual({ idToken: 'id_token', accessToken: 'access_token' }))
            .then(() => expect(spyInsideMap).toHaveBeenCalledTimes(1));

          (silentRenewService as any).fireRefreshWithIframeCompleted({
            authResult: { id_token: 'id_token', access_token: 'access_token' },
          });

          (silentRenewService as any).fireRefreshWithIframeCompleted({
            authResult: { id_token: 'id_token2', access_token: 'access_token2' },
          });
        })
      );
    });
  });

  describe('startRefreshSession', () => {
    it(
      'returns null if no auth well known endpoint defined',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

        (refreshSessionService as any).startRefreshSession().subscribe((result) => {
          expect(result).toBe(null);
        });
      })
    );

    it(
      'returns null if silent renew Is running',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

        (refreshSessionService as any).startRefreshSession().subscribe((result) => {
          expect(result).toBe(null);
        });
      })
    );

    it(
      'returns null if no authwellknownendpoints are given',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ authWellknownEndpoint: null });
        (refreshSessionService as any).startRefreshSession().subscribe((result) => {
          expect(result).toBe(null);
        });
      })
    );

    it(
      'calls `setSilentRenewRunning` when should be executed',
      waitForAsync(() => {
        const setSilentRenewRunningSpy = spyOn(flowsDataService, 'setSilentRenewRunning');

        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
        spyOn(refreshSessionRefreshTokenService, 'refreshSessionWithRefreshTokens').and.returnValue(of(null));

        (refreshSessionService as any).startRefreshSession().subscribe(() => {
          expect(setSilentRenewRunningSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls refreshSessionWithRefreshTokens when current flow is codeflow with refresh tokens',
      waitForAsync(() => {
        spyOn(flowsDataService, 'setSilentRenewRunning');

        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
        const refreshSessionWithRefreshTokensSpy = spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        ).and.returnValue(of(null));

        (refreshSessionService as any).startRefreshSession().subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens',
      waitForAsync(() => {
        spyOn(flowsDataService, 'setSilentRenewRunning');

        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(false);
        const refreshSessionWithRefreshTokensSpy = spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        ).and.returnValue(of(null));

        const refreshSessionWithIframeSpy = spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(null));

        (refreshSessionService as any).startRefreshSession().subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
          expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
        });
      })
    );
  });
});
