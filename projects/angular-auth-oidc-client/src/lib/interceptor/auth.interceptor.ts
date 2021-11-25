import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { ClosestMatchingRouteService } from './closest-matching-route.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authStateService: AuthStateService,
    private configurationProvider: ConfigurationProvider,
    private loggerService: LoggerService,
    private closestMatchingRouteService: ClosestMatchingRouteService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.configurationProvider.hasAtLeastOneConfig()) {
      return next.handle(req);
    }

    const allConfigurations = this.configurationProvider.getAllConfigurations();
    const allRoutesConfigured = allConfigurations.map((x) => x.secureRoutes || []);
    const allRoutesConfiguredFlat = [].concat.apply([], allRoutesConfigured);

    if (allRoutesConfiguredFlat.length === 0) {
      const { configId } = allConfigurations[0];
      this.loggerService.logDebug(configId, `No routes to check configured`);

      return next.handle(req);
    }

    const { matchingConfigId, matchingRoute } = this.closestMatchingRouteService.getConfigIdForClosestMatchingRoute(req.url);

    if (!matchingConfigId) {
      const { configId } = allConfigurations[0];
      this.loggerService.logDebug(configId, `Did not find any configured route for route ${req.url}`);

      return next.handle(req);
    }

    this.loggerService.logDebug(matchingConfigId, `'${req.url}' matches configured route '${matchingRoute}'`);

    const token = this.authStateService.getAccessToken(matchingConfigId);

    if (!token) {
      this.loggerService.logDebug(matchingConfigId, `Wanted to add token to ${req.url} but found no token: '${token}'`);

      return next.handle(req);
    }

    this.loggerService.logDebug(matchingConfigId, `'${req.url}' matches configured route '${matchingRoute}', adding token`);
    req = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token),
    });

    return next.handle(req);
  }
}
