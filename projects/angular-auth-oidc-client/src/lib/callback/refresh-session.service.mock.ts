import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';

@Injectable({ providedIn: 'root' })
export class RefreshSessionServiceMock {
  forceRefreshSession(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    extraCustomParams?: { [key: string]: string | number | boolean }
  ) {}
  userForceRefreshSession(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    extraCustomParams?: { [key: string]: string | number | boolean }
  ) {}
}
