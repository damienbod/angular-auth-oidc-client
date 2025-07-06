import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { IntervalService } from '../callback/interval.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { IFrameService } from './existing-iframe.service';

export const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable({ providedIn: 'root' })
export class SilentRenewService {
  private readonly refreshSessionWithIFrameCompletedInternal$ =
    new Subject<CallbackContext & {configId?:string} |{configId?:string} >();

  get refreshSessionWithIFrameCompleted$(): Observable<CallbackContext & {configId?:string} | {configId?:string}> {
    return this.refreshSessionWithIFrameCompletedInternal$.asObservable();
  }

  private readonly loggerService = inject(LoggerService);
  private readonly iFrameService = inject(IFrameService);
  private readonly flowsService = inject(FlowsService);
  private readonly resetAuthDataService = inject(ResetAuthDataService);
  private readonly flowsDataService = inject(FlowsDataService);
  private readonly authStateService = inject(AuthStateService);
  private readonly flowHelper = inject(FlowHelper);
  private readonly implicitFlowCallbackService = inject(
    ImplicitFlowCallbackService
  );
  private readonly intervalService = inject(IntervalService);

  getOrCreateIframe(config: OpenIdConfiguration): HTMLIFrameElement {
    // Create unique iframe identifier for each configuration
    const iframeId = `${IFRAME_FOR_SILENT_RENEW_IDENTIFIER}_${config.configId}`;
    const existingIframe = this.iFrameService.getExistingIFrame(iframeId);

    if (!existingIframe) {
      this.loggerService.logDebug(config, `Creating new iframe: ${iframeId}`);

      return this.iFrameService.addIFrameToWindowBody(
        iframeId,
        config
      );
    }

    this.loggerService.logDebug(config, `Using existing iframe: ${iframeId}`);

    return existingIframe;
  }

  isSilentRenewConfigured(configuration: OpenIdConfiguration): boolean {
    const { useRefreshToken, silentRenew } = configuration;

    return !useRefreshToken && Boolean(silentRenew);
  }

  codeFlowCallbackSilentRenewIframe(
    urlParts: string[],
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    const params = new HttpParams({
      fromString: urlParts[1],
    });
    const errorParam = params.get('error');

    if (errorParam) {
      this.authStateService.updateAndPublishAuthState({
        isAuthenticated: false,
        validationResult: ValidationResult.LoginRequired,
        isRenewProcess: true,
        configId: config.configId,
      });
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
      this.flowsDataService.setNonce('', config);
      this.intervalService.stopPeriodicTokenCheck();

      return throwError(() => new Error(errorParam));
    }

    const code = params.get('code') ?? '';
    const state = params.get('state') ?? '';
    const sessionState = params.get('session_state');
    const callbackContext: CallbackContext = {
      code,
      refreshToken: '',
      state,
      sessionState,
      authResult: null,
      isRenewProcess: true,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return this.flowsService
      .processSilentRenewCodeFlowCallback(callbackContext, config, allConfigs)
      .pipe(
        catchError((error) => {
          this.intervalService.stopPeriodicTokenCheck();
          this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

          return throwError(() => new Error(error));
        })
      );
  }

  silentRenewEventHandler(
    e: CustomEvent,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
    this.loggerService.logDebug(config, 'silentRenewEventHandler');
    if (!e.detail) {
      return;
    }

    let callback$: Observable<CallbackContext>;
    const isCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(config);

    if (isCodeFlow) {
      const urlParts = e.detail.toString().split('?');

      callback$ = this.codeFlowCallbackSilentRenewIframe(
        urlParts,
        config,
        allConfigs
      );
    } else {
      callback$ =
        this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(
          config,
          allConfigs,
          e.detail
        );
    }

    callback$.subscribe({
      next: (callbackContext) => {
        this.refreshSessionWithIFrameCompletedInternal$.next({...callbackContext, configId: config.configId});
        this.flowsDataService.resetSilentRenewRunning(config);
      },
      error: (err: unknown) => {
        this.loggerService.logError(config, 'Error: ' + err);
        this.refreshSessionWithIFrameCompletedInternal$.next({configId: config.configId});
        this.flowsDataService.resetSilentRenewRunning(config);
      },
    });
  }
}
