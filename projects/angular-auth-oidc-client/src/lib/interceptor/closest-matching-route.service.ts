import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { wildcardToRegExp } from '../utils/regex/regex.helper';

@Injectable({ providedIn: 'root' })
export class ClosestMatchingRouteService {
  getConfigIdForClosestMatchingRoute(
    route: string,
    configurations: OpenIdConfiguration[]
  ): ClosestMatchingRouteResult {
    for (const config of configurations) {
      const { secureRoutes } = config;

      const matchingRoute = (secureRoutes ?? []).find((secureRoute) =>
        this.routeMatches(secureRoute, route)
      );

      if (matchingRoute) {
        return {
          matchingRoute,
          matchingConfig: config,
        };
      }
    }

    return {
      matchingRoute: null,
      matchingConfig: null,
    };
  }

  private routeMatches(configuredRoute: string, route: string): boolean {
    return (
      route.startsWith(configuredRoute) ||
      this.matchesRoute(configuredRoute, route)
    );
  }

  private matchesRoute(configuredRoute: string, route: string): boolean {
    const regex = wildcardToRegExp(configuredRoute);

    return regex.test(route);
  }
}

export interface ClosestMatchingRouteResult {
  matchingRoute: string | null;
  matchingConfig: OpenIdConfiguration | null;
}
