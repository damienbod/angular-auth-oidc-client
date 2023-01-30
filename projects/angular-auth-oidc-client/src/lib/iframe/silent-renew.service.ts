import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { IntervalService } from '../callback/interval.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable()
export class SilentRenewService {
  private readonly refreshSessionWithIFrameCompletedInternal$ = new Subject<CallbackContext>();

  get refreshSessionWithIFrameCompleted$(): Observable<CallbackContext> {
    return this.refreshSessionWithIFrameCompletedInternal$.asObservable();
  }

  constructor(
    private readonly iFrameService: IFrameService,
    private readonly flowsService: FlowsService,
    private readonly resetAuthDataService: ResetAuthDataService,
    private readonly flowsDataService: FlowsDataService,
    private readonly authStateService: AuthStateService,
    private readonly loggerService: LoggerService,
    private readonly flowHelper: FlowHelper,
    private readonly implicitFlowCallbackService: ImplicitFlowCallbackService,
    private readonly intervalService: IntervalService
  ) {}

  getOrCreateIframe(config: OpenIdConfiguration): HTMLIFrameElement {
    const existingIframe = this.getExistingIframe();

    if (!existingIframe) {
      return this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_SILENT_RENEW_IDENTIFIER, config);
    }

    return existingIframe;
  }

  isSilentRenewConfigured(configuration: OpenIdConfiguration): boolean {
    const { useRefreshToken, silentRenew } = configuration;

    return !useRefreshToken && silentRenew;
  }

  codeFlowCallbackSilentRenewIframe(
    urlParts: string[],
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    const params = new HttpParams({
      fromString: urlParts[1],
    });

    const error = params.get('error');

    if (error) {
      this.authStateService.updateAndPublishAuthState({
        isAuthenticated: false,
        validationResult: ValidationResult.LoginRequired,
        isRenewProcess: true,
      });
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
      this.flowsDataService.setNonce('', config);
      this.intervalService.stopPeriodicTokenCheck();

      return throwError(() => new Error(error));
    }

    const code = params.get('code');
    const state = params.get('state');
    const sessionState = params.get('session_state');

    const callbackContext = {
      code,
      refreshToken: null,
      state,
      sessionState,
      authResult: null,
      isRenewProcess: true,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return this.flowsService.processSilentRenewCodeFlowCallback(callbackContext, config, allConfigs).pipe(
      catchError(() => {
        this.intervalService.stopPeriodicTokenCheck();
        this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

        return throwError(() => new Error(error));
      })
    );
  }

  silentRenewEventHandler(e: CustomEvent, config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    this.loggerService.logDebug(config, 'silentRenewEventHandler');
    if (!e.detail) {
      return;
    }

    let callback$: Observable<CallbackContext>;
    const isCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(config);

    if (isCodeFlow) {
      const urlParts = e.detail.toString().split('?');

      callback$ = this.codeFlowCallbackSilentRenewIframe(urlParts, config, allConfigs);
    } else {
      callback$ = this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(config, allConfigs, e.detail);
    }

    callback$.subscribe({
      next: (callbackContext) => {
        this.refreshSessionWithIFrameCompletedInternal$.next(callbackContext);
        this.flowsDataService.resetSilentRenewRunning(config);
      },
      error: (err: any) => {
        this.loggerService.logError(config, 'Error: ' + err);
        this.refreshSessionWithIFrameCompletedInternal$.next(null);
        this.flowsDataService.resetSilentRenewRunning(config);
      },
    });
  }

  private getExistingIframe(): HTMLIFrameElement {
    return this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
  }
}
