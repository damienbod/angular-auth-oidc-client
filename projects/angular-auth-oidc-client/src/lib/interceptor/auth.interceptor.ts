import { HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoggerService } from '../logging/logger.service';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authStateService: AuthStateService,
    private readonly configurationService: ConfigurationService,
    private readonly loggerService: LoggerService,
    private readonly closestMatchingRouteService: ClosestMatchingRouteService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return interceptRequest(req, next.handle, {
      configurationService: this.configurationService,
      authStateService: this.authStateService,
      closestMatchingRouteService: this.closestMatchingRouteService,
      loggerService: this.loggerService,
    });
  }
}

export function authInterceptor(): HttpInterceptorFn {
  return (req, next) => {
    return interceptRequest(req, next, {
      configurationService: inject(ConfigurationService),
      authStateService: inject(AuthStateService),
      closestMatchingRouteService: inject(ClosestMatchingRouteService),
      loggerService: inject(LoggerService),
    });
  };
}

function interceptRequest(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  deps: {
    authStateService: AuthStateService;
    configurationService: ConfigurationService;
    loggerService: LoggerService;
    closestMatchingRouteService: ClosestMatchingRouteService;
  }
): Observable<HttpEvent<unknown>> {
  if (!deps.configurationService.hasAtLeastOneConfig()) {
    return next(req);
  }

  const allConfigurations = deps.configurationService.getAllConfigurations();
  const allRoutesConfigured = allConfigurations.map((x) => x.secureRoutes || []);
  const allRoutesConfiguredFlat = [].concat(...allRoutesConfigured) as string[];

  if (allRoutesConfiguredFlat.length === 0) {
    deps.loggerService.logDebug(allConfigurations[0], `No routes to check configured`);

    return next(req);
  }

  const { matchingConfig, matchingRoute } = deps.closestMatchingRouteService.getConfigIdForClosestMatchingRoute(req.url, allConfigurations);

  if (!matchingConfig) {
    deps.loggerService.logDebug(allConfigurations[0], `Did not find any configured route for route ${req.url}`);

    return next(req);
  }

  deps.loggerService.logDebug(matchingConfig, `'${req.url}' matches configured route '${matchingRoute}'`);
  const token = deps.authStateService.getAccessToken(matchingConfig);

  if (!token) {
    deps.loggerService.logDebug(matchingConfig, `Wanted to add token to ${req.url} but found no token: '${token}'`);
    
    return next(req);
  }

  deps.loggerService.logDebug(matchingConfig, `'${req.url}' matches configured route '${matchingRoute}', adding token`);
  req = req.clone({
    headers: req.headers.set('Authorization', 'Bearer ' + token),
  });

  return next(req);
}
