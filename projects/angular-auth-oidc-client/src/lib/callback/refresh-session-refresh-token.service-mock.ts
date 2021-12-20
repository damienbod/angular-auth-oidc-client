import { OpenIdConfiguration } from '../config/openid-configuration';

export class RefreshSessionRefreshTokenServiceMock {
  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ) {}
}
