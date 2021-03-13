import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/config.provider';

@Injectable()
export class FlowHelper {
  constructor(private configurationProvider: ConfigurationProvider) {}

  isCurrentFlowCodeFlow() {
    return this.currentFlowIs('code');
  }

  isCurrentFlowAnyImplicitFlow() {
    return this.isCurrentFlowImplicitFlowWithAccessToken() || this.isCurrentFlowImplicitFlowWithoutAccessToken();
  }

  isCurrentFlowCodeFlowWithRefreshTokens() {
    const { useRefreshToken } = this.configurationProvider.getOpenIDConfiguration();

    if (this.isCurrentFlowCodeFlow() && useRefreshToken) {
      return true;
    }

    return false;
  }

  isCurrentFlowImplicitFlowWithAccessToken() {
    return this.currentFlowIs('id_token token');
  }

  isCurrentFlowImplicitFlowWithoutAccessToken() {
    return this.currentFlowIs('id_token');
  }

  currentFlowIs(flowTypes: string[] | string) {
    const { responseType } = this.configurationProvider.getOpenIDConfiguration();

    if (Array.isArray(flowTypes)) {
      return flowTypes.some((x) => responseType === x);
    }

    return responseType === flowTypes;
  }
}
