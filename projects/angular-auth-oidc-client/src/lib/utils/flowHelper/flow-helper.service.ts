import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/config.provider';

@Injectable()
export class FlowHelper {
  constructor(private configurationProvider: ConfigurationProvider) {}

  isCurrentFlowCodeFlow(configId: string) {
    return this.currentFlowIs('code', configId);
  }

  isCurrentFlowAnyImplicitFlow(configId: string) {
    return this.isCurrentFlowImplicitFlowWithAccessToken(configId) || this.isCurrentFlowImplicitFlowWithoutAccessToken(configId);
  }

  isCurrentFlowCodeFlowWithRefreshTokens(configId: string) {
    const { useRefreshToken } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (this.isCurrentFlowCodeFlow(configId) && useRefreshToken) {
      return true;
    }

    return false;
  }

  isCurrentFlowImplicitFlowWithAccessToken(configId: string) {
    return this.currentFlowIs('id_token token', configId);
  }

  isCurrentFlowImplicitFlowWithoutAccessToken(configId: string) {
    return this.currentFlowIs('id_token', configId);
  }

  currentFlowIs(flowTypes: string[] | string, configId: string) {
    const { responseType } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (Array.isArray(flowTypes)) {
      return flowTypes.some((x) => responseType === x);
    }

    return responseType === flowTypes;
  }
}
