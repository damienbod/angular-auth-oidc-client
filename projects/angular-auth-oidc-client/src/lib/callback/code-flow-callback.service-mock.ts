import { OpenIdConfiguration } from '../config/openid-configuration';

export class CodeFlowCallbackServiceMock {
  authenticatedCallbackWithCode(urlToCheck: string, config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]) {}
}
