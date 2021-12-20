import { OpenIdConfiguration } from '../config/openid-configuration';

export class ImplicitFlowCallbackServiceMock {
  authenticatedImplicitFlowCallback(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], hash?: string) {}
}
