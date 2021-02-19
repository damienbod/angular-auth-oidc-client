import { Injectable } from '@angular/core';

@Injectable()
export class FlowHelperMock {
  isCurrentFlowCodeFlow() {
    return this.currentFlowIs('code');
  }

  isCurrentFlowAnyImplicitFlow() {
    return this.isCurrentFlowImplicitFlowWithAccessToken() || this.isCurrentFlowImplicitFlowWithoutAccessToken();
  }

  isCurrentFlowCodeFlowWithRefreshTokens() {
    return null;
  }

  isCurrentFlowImplicitFlowWithAccessToken() {
    return this.currentFlowIs('id_token token');
  }

  isCurrentFlowImplicitFlowWithoutAccessToken() {
    return this.currentFlowIs('id_token');
  }

  currentFlowIs(flowTypes: string[] | string) {
    return null;
  }
}
