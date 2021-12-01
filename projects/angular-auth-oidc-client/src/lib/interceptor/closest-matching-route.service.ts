import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';

@Injectable()
export class ClosestMatchingRouteService {
  getConfigIdForClosestMatchingRoute(route: string, configurations: OpenIdConfiguration[]): ClosestMatchingRouteResult {
    for (const config of configurations) {
      const { secureRoutes } = config;

      for (const configuredRoute of secureRoutes) {
        if (route.startsWith(configuredRoute)) {
          return {
            matchingRoute: configuredRoute,
            matchingConfig: config,
          };
        }
      }
    }

    return {
      matchingRoute: null,
      matchingConfig: null,
    };
  }
}

export interface ClosestMatchingRouteResult {
  matchingRoute: string;
  matchingConfig: OpenIdConfiguration;
}
