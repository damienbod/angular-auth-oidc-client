import { OpenIdConfiguration } from '../config/openid-configuration';

export class PeriodicallyTokenCheckServiceMock {
  startTokenValidationPeriodically(allConfigs: OpenIdConfiguration[], currentConfig: OpenIdConfiguration) {}
}
