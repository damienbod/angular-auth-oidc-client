import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoggerService } from '../logging/logger.service';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authStateService: AuthStateService,
    private configurationService: ConfigurationService,
    private loggerService: LoggerService,
    private closestMatchingRouteService: ClosestMatchingRouteService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.configurationService.hasAtLeastOneConfig()) {
      return next.handle(req);
    }

    const allConfigurations = this.configurationService.getAllConfigurations();
    const allRoutesConfigured = allConfigurations.map((x) => x.secureRoutes || []);
    const allRoutesConfiguredFlat = [].concat.apply([], allRoutesConfigured);

    if (allRoutesConfiguredFlat.length === 0) {
      this.loggerService.logDebug(allConfigurations[0], `No routes to check configured`);

      return next.handle(req);
    }

    const { matchingConfig, matchingRoute } = this.closestMatchingRouteService.getConfigIdForClosestMatchingRoute(
      req.url,
      allConfigurations
    );

    if (!matchingConfig) {
      this.loggerService.logDebug(allConfigurations[0], `Did not find any configured route for route ${req.url}`);

      return next.handle(req);
    }

    this.loggerService.logDebug(matchingConfig, `'${req.url}' matches configured route '${matchingRoute}'`);

    const token = this.authStateService.getAccessToken(matchingConfig);

    if (!token) {
      this.loggerService.logDebug(matchingConfig, `Wanted to add token to ${req.url} but found no token: '${token}'`);

      return next.handle(req);
    }

    this.loggerService.logDebug(matchingConfig, `'${req.url}' matches configured route '${matchingRoute}', adding token`);
    req = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token),
    });

    return next.handle(req);
  }
}
