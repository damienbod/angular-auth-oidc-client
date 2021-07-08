import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

@Injectable({ providedIn: 'root' })
export class AutoRedirectRoutesGuard implements CanActivate, CanLoad {
  constructor(
    private autoLoginService: AutoLoginService,
    private authStateService: AuthStateService,
    private loginService: LoginService,
    private configurationProvider: ConfigurationProvider
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): boolean {
    const routeToRedirect = segments.join('/');

    return this.checkAuth(routeToRedirect);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): boolean {
    const configId = this.getId();

    const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configId);

    if (isAuthenticated) {
      this.autoLoginService.checkSavedRedirectRouteAndNavigate(configId);
    }

    if (!isAuthenticated) {
      this.autoLoginService.saveRedirectRoute(configId, url);
    }

    return true;
  }

  private getId(): string {
    return this.configurationProvider.getOpenIDConfiguration().configId;
  }
}
