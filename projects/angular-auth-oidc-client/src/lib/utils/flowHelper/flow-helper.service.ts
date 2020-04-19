import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config';

@Injectable({ providedIn: 'root' })
export class FlowHelper {
    constructor(private configurationProvider: ConfigurationProvider) {}

    isCurrentFlowCodeFlow() {
        return this.currentFlowIs('code');
    }

    currentFlowIs(flowTypes: string[] | string) {
        const currentFlow = this.configurationProvider.openIDConfiguration.responseType;

        if (Array.isArray(flowTypes)) {
            return flowTypes.some((x) => currentFlow === x);
        }

        return currentFlow === flowTypes;
    }
}
