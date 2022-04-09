import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';

/**
 * Implement this class-interface to create a custom logger service.
 */
@Injectable()
export abstract class AbstractLoggerService {
  abstract logError(configuration: OpenIdConfiguration, message: any, ...args: any[]): void;

  abstract logWarning(configuration: OpenIdConfiguration, message: any, ...args: any[]): void;

  abstract logDebug(configuration: OpenIdConfiguration, message: any, ...args: any[]): void;
}
