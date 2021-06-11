import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/provider/config.provider';

@Injectable()
export class FlowHelper {
  constructor(private configurationProvider: ConfigurationProvider) {}

  isCurrentFlowCodeFlow(configId: string): boolean {
    return this.currentFlowIs('code', configId);
  }

  isCurrentFlowAnyImplicitFlow(configId: string): boolean {
    return this.isCurrentFlowImplicitFlowWithAccessToken(configId) || this.isCurrentFlowImplicitFlowWithoutAccessToken(configId);
  }

  isCurrentFlowCodeFlowWithRefreshTokens(configId: string): boolean {
    const { useRefreshToken } = this.configurationProvider.getOpenIDConfiguration(configId);
    if (this.isCurrentFlowCodeFlow(configId) && useRefreshToken) {
      return true;
    }

    return false;
  }

  isCurrentFlowImplicitFlowWithAccessToken(configId: string): boolean {
    return this.currentFlowIs('id_token token', configId);
  }

  currentFlowIs(flowTypes: string[] | string, configId: string): boolean {
    const { responseType } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (Array.isArray(flowTypes)) {
      return flowTypes.some((x) => responseType === x);
    }

    return responseType === flowTypes;
  }

  private isCurrentFlowImplicitFlowWithoutAccessToken(configId: string): boolean {
    return this.currentFlowIs('id_token', configId);
  }
}
