import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { AuthStateService } from '../authState/auth-state.service';
import { CheckAuthService } from '../check-auth.service';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginGuard implements CanActivate, CanLoad {
  constructor(
    private autoLoginService: AutoLoginService,
    private authStateService: AuthStateService,
    private checkAuthService: CheckAuthService,
    private loginService: LoginService,
    private router: Router,
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

    const isAuthenticatedAlready = this.authStateService.areAuthStorageTokensValid(configId);

    if (isAuthenticatedAlready) {
      return true;
    }

    const storedRoute = this.autoLoginService.getStoredRedirectRoute(configId);
    if (isAuthenticatedAlready) {
      if (storedRoute) {
        this.autoLoginService.deleteStoredRedirectRoute(configId);
        this.router.navigateByUrl(storedRoute);
      }

      return true;
    }

    this.autoLoginService.saveStoredRedirectRoute(configId, url);
    this.loginService.login(configId);

    return false;
  }

  private getId(): string {
    return this.configurationProvider.getOpenIDConfiguration().configId;
  }
}
