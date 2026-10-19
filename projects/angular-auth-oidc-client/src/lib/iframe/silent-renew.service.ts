import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { IntervalService } from '../callback/interval.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AuthResult, CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/services/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

export const getFrameId = (configId?: string): string =>
  `${IFRAME_FOR_SILENT_RENEW_IDENTIFIER}_${configId}`;

export class SilentRenewCallbackError extends Error {
  constructor(
    error: string,
    readonly errorDescription?: string
  ) {
    super(error);
  }
}

type RefreshSessionWithIFrameCompleted =
  | { success: true; authResult: AuthResult | null; configId?: string }
  | {
      success: false;
      configId?: string;
      errorMessage?: string;
      errorDescription?: string;
    };

@Injectable({ providedIn: 'root' })
export class SilentRenewService {
  private readonly refreshSessionWithIFrameCompletedInternal$ =
    new Subject<RefreshSessionWithIFrameCompleted>();

  get refreshSessionWithIFrameCompleted$(): Observable<RefreshSessionWithIFrameCompleted> {
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
    const iframeId = getFrameId(config.configId);
    const existingIframe = this.iFrameService.getExistingIFrame(iframeId);

    if (existingIframe) {
      this.loggerService.logDebug(config, `Using existing iframe: ${iframeId}`);

      return existingIframe;
    }

    this.loggerService.logDebug(config, `Creating new iframe: ${iframeId}`);

    return this.iFrameService.addIFrameToWindowBody(iframeId, config);
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
    const params = new HttpParams({ fromString: urlParts[1] });
    const errorParam = params.get('error');

    if (errorParam) {
      return this.rejectSilentRenewRefusedByServer(
        errorParam,
        params,
        config,
        allConfigs
      );
    }

    return this.processSilentRenewCode(params, config, allConfigs);
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

    this.createSilentRenewCallback(e, config, allConfigs).subscribe({
      next: ({ authResult }) =>
        this.publishSilentRenewSucceeded(authResult, config),
      error: (error: unknown) => this.publishSilentRenewFailed(error, config),
    });
  }

  private rejectSilentRenewRefusedByServer(
    errorParam: string,
    params: HttpParams,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<never> {
    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult: ValidationResult.LoginRequired,
      isRenewProcess: true,
      configId: config.configId,
    });
    this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
    this.flowsDataService.setNonce('', config);
    this.intervalService.stopPeriodicTokenCheck();

    return throwError(
      () =>
        new SilentRenewCallbackError(
          errorParam,
          params.get('error_description') ?? undefined
        )
    );
  }

  private processSilentRenewCode(
    params: HttpParams,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    const callbackContext = this.createSilentRenewCallbackContext(params);

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

  private createSilentRenewCallbackContext(
    params: HttpParams
  ): CallbackContext {
    return {
      code: params.get('code') ?? '',
      refreshToken: '',
      state: params.get('state') ?? '',
      sessionState: params.get('session_state'),
      authResult: null,
      isRenewProcess: true,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };
  }

  private createSilentRenewCallback(
    e: CustomEvent,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    if (this.flowHelper.isCurrentFlowCodeFlow(config)) {
      const urlParts = e.detail.toString().split('?');

      return this.codeFlowCallbackSilentRenewIframe(
        urlParts,
        config,
        allConfigs
      );
    }

    return this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(
      config,
      allConfigs,
      e.detail
    );
  }

  private publishSilentRenewSucceeded(
    authResult: AuthResult | null,
    config: OpenIdConfiguration
  ): void {
    this.refreshSessionWithIFrameCompletedInternal$.next({
      authResult,
      configId: config.configId,
      success: true,
    });
    this.flowsDataService.resetSilentRenewRunning(config);
  }

  private publishSilentRenewFailed(
    error: unknown,
    config: OpenIdConfiguration
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDescription =
      error instanceof SilentRenewCallbackError
        ? error.errorDescription
        : undefined;

    this.loggerService.logError(config, 'Error: ' + error);
    this.refreshSessionWithIFrameCompletedInternal$.next({
      configId: config.configId,
      success: false,
      errorMessage,
      ...(errorDescription === undefined ? {} : { errorDescription }),
    });
    this.flowsDataService.resetSilentRenewRunning(config);
  }
}
