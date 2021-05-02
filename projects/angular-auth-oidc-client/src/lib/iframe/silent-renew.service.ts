import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { IntervalService } from '../callback/interval.service';
import { ConfigurationProvider } from '../config/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable()
export class SilentRenewService {
  private refreshSessionWithIFrameCompletedInternal$ = new Subject<CallbackContext>();

  get refreshSessionWithIFrameCompleted$() {
    return this.refreshSessionWithIFrameCompletedInternal$.asObservable();
  }

  constructor(
    private configurationProvider: ConfigurationProvider,
    private iFrameService: IFrameService,
    private flowsService: FlowsService,
    private resetAuthDataService: ResetAuthDataService,
    private flowsDataService: FlowsDataService,
    private authStateService: AuthStateService,
    private loggerService: LoggerService,
    private flowHelper: FlowHelper,
    private implicitFlowCallbackService: ImplicitFlowCallbackService,
    private intervalService: IntervalService
  ) {}

  getOrCreateIframe(configId: string): HTMLIFrameElement {
    const existingIframe = this.getExistingIframe();

    if (!existingIframe) {
      return this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_SILENT_RENEW_IDENTIFIER, configId);
    }

    return existingIframe;
  }

  isSilentRenewConfigured(configId: string) {
    const { useRefreshToken, silentRenew } = this.configurationProvider.getOpenIDConfiguration(configId);
    return !useRefreshToken && silentRenew;
  }

  codeFlowCallbackSilentRenewIframe(urlParts: any, configId: string) {
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
      this.resetAuthDataService.resetAuthorizationData();
      this.flowsDataService.setNonce('');
      this.intervalService.stopPeriodicTokenCheck();
      return throwError(error);
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

    return this.flowsService.processSilentRenewCodeFlowCallback(callbackContext, configId).pipe(
      catchError((errorFromFlow) => {
        this.intervalService.stopPeriodicTokenCheck();
        this.resetAuthDataService.resetAuthorizationData();
        return throwError(errorFromFlow);
      })
    );
  }

  silentRenewEventHandler(e: CustomEvent, configId: string) {
    this.loggerService.logDebug(configId, 'silentRenewEventHandler');
    if (!e.detail) {
      return;
    }

    let callback$ = of(null);

    const isCodeFlow = this.flowHelper.isCurrentFlowCodeFlow();

    if (isCodeFlow) {
      const urlParts = e.detail.toString().split('?');
      callback$ = this.codeFlowCallbackSilentRenewIframe(urlParts, configId);
    } else {
      callback$ = this.implicitFlowCallbackService.authorizedImplicitFlowCallback(e.detail);
    }

    callback$.subscribe(
      (callbackContext) => {
        this.refreshSessionWithIFrameCompletedInternal$.next(callbackContext);
        this.flowsDataService.resetSilentRenewRunning();
      },
      (err: any) => {
        this.loggerService.logError(configId, 'Error: ' + err);
        this.refreshSessionWithIFrameCompletedInternal$.next(null);
        this.flowsDataService.resetSilentRenewRunning();
      }
    );
  }

  private getExistingIframe() {
    return this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
  }
}
