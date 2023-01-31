import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';

@Injectable({ providedIn: 'root' })
export class FlowHelper {
  isCurrentFlowCodeFlow(configuration: OpenIdConfiguration): boolean {
    return this.currentFlowIs('code', configuration);
  }

  isCurrentFlowAnyImplicitFlow(configuration: OpenIdConfiguration): boolean {
    return this.isCurrentFlowImplicitFlowWithAccessToken(configuration) || this.isCurrentFlowImplicitFlowWithoutAccessToken(configuration);
  }

  isCurrentFlowCodeFlowWithRefreshTokens(configuration: OpenIdConfiguration): boolean {
    const { useRefreshToken } = configuration;

    return this.isCurrentFlowCodeFlow(configuration) && useRefreshToken;
  }

  isCurrentFlowImplicitFlowWithAccessToken(configuration: OpenIdConfiguration): boolean {
    return this.currentFlowIs('id_token token', configuration);
  }

  currentFlowIs(flowTypes: string[] | string, configuration: OpenIdConfiguration): boolean {
    const { responseType } = configuration;

    if (Array.isArray(flowTypes)) {
      return flowTypes.some((x) => responseType === x);
    }

    return responseType === flowTypes;
  }

  private isCurrentFlowImplicitFlowWithoutAccessToken(configuration: OpenIdConfiguration): boolean {
    return this.currentFlowIs('id_token', configuration);
  }
}
