import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from './../logging/logger.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authStateService: AuthStateService,
    private configurationProvider: ConfigurationProvider,
    private loggerService: LoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ensure we send the token only to routes which are secured
    const { secureRoutes } = this.configurationProvider.openIDConfiguration;

    if (!secureRoutes) {
      this.loggerService.logDebug(`No routes to check configured`);
      return next.handle(req);
    }

    const matchingRoute = secureRoutes.find((x) => req.url.startsWith(x));

    if (!matchingRoute) {
      this.loggerService.logDebug(`Did not find matching route for ${req.url}`);
      return next.handle(req);
    }

    this.loggerService.logDebug(`'${req.url}' matches configured route '${matchingRoute}'`);

    const token = this.authStateService.getAccessToken();

    if (!token) {
      this.loggerService.logDebug(`Wanted to add token to ${req.url} but found no token: '${token}'`);
      return next.handle(req);
    }

    this.loggerService.logDebug(`'${req.url}' matches configured route '${matchingRoute}', adding token`);
    req = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token),
    });

    return next.handle(req);
  }
}
