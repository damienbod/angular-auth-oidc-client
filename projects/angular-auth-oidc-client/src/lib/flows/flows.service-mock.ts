import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from './callback-context';

@Injectable()
export class FlowsServiceMock {
  processCodeFlowCallback(urlToCheck: string, config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): Observable<CallbackContext> {
    return null;
  }

  processSilentRenewCodeFlowCallback(
    firstContext: CallbackContext,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return null;
  }

  processImplicitFlowCallback(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], hash?: string): Observable<CallbackContext> {
    return null;
  }

  processRefreshToken(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    return null;
  }
}
