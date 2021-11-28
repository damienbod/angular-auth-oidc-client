import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';

@Injectable()
export class LoggerServiceMock {
  logError(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {}

  logWarning(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {}

  logDebug(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {}
}
