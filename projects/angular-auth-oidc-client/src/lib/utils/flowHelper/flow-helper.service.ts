import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config';

// TODO  TESTING
@Injectable()
export class FlowHelper {
    constructor(private configurationProvider: ConfigurationProvider) {}

    isCurrentFlowCodeFlow() {
        return this.currentFlowIs('code');
    }

    isCurrentFlowCodeFlowWithRefeshTokens() {
        if (this.isCurrentFlowCodeFlow() && this.configurationProvider.openIDConfiguration.useRefreshToken) {
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
        const currentFlow = this.configurationProvider.openIDConfiguration.responseType;

        if (Array.isArray(flowTypes)) {
            return flowTypes.some((x) => currentFlow === x);
        }

        return currentFlow === flowTypes;
    }
}
