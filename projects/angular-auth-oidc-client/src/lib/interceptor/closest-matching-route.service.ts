import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';

@Injectable()
export class ClosestMatchingRouteService {
  constructor(private configProvider: ConfigurationProvider) {}

  getConfigIdForClosestMatchingRoute(route: string): ClosestMatchingRouteResult {
    const allConfiguredRoutes = this.getAllConfiguredRoutes();

    for (const routesWithConfig of allConfiguredRoutes) {
      const allRoutesForConfig = routesWithConfig.routes;

      for (const configuredRoute of allRoutesForConfig) {
        if (route.startsWith(configuredRoute)) {
          return {
            matchingRoute: configuredRoute,
            matchingConfigId: routesWithConfig.configId,
          };
        }
      }
    }

    return {
      matchingRoute: null,
      matchingConfigId: null,
    };
  }

  private getAllConfiguredRoutes(): ConfiguredRoutesWithConfig[] {
    const allConfigurations = this.configProvider.getAllConfigurations();

    return allConfigurations.map((x) => ({ routes: x.secureRoutes, configId: x.configId }));
  }
}

export interface ConfiguredRoutesWithConfig {
  routes: string[];
  configId: string;
}

export interface ClosestMatchingRouteResult {
  matchingRoute: string;
  matchingConfigId: string;
}
