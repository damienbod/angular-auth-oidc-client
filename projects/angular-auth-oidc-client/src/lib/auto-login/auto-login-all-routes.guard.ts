import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { CheckAuthService } from '../auth-state/check-auth.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

/**
 * @deprecated Please do not use the `AutoLoginAllRoutesGuard` anymore as it is not recommended anymore, deprecated and will be removed in future versions of this library. More information [Why is AutoLoginAllRoutesGuard not recommended?](https://github.com/damienbod/angular-auth-oidc-client/issues/1549)
 */
@Injectable({ providedIn: 'root' })
export class AutoLoginAllRoutesGuard {
  constructor(
    private readonly autoLoginService: AutoLoginService,
    private readonly checkAuthService: CheckAuthService,
    private readonly loginService: LoginService,
    private readonly configurationService: ConfigurationService,
    private readonly router: Router
  ) {}

  canLoad(): Observable<boolean> {
    const url =
      this.router
        .getCurrentNavigation()
        ?.extractedUrl.toString()
        .substring(1) ?? '';

    return checkAuth(
      url,
      this.configurationService,
      this.checkAuthService,
      this.autoLoginService,
      this.loginService
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return checkAuth(
      state.url,
      this.configurationService,
      this.checkAuthService,
      this.autoLoginService,
      this.loginService
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return checkAuth(
      state.url,
      this.configurationService,
      this.checkAuthService,
      this.autoLoginService,
      this.loginService
    );
  }
}

function checkAuth(
  url: string,
  configurationService: ConfigurationService,
  checkAuthService: CheckAuthService,
  autoLoginService: AutoLoginService,
  loginService: LoginService
): Observable<boolean> {
  return configurationService.getOpenIDConfiguration().pipe(
    switchMap((config) => {
      const allConfigs = configurationService.getAllConfigurations();

      return checkAuthService.checkAuth(config, allConfigs).pipe(
        take(1),
        map(({ isAuthenticated }) => {
          if (isAuthenticated) {
            autoLoginService.checkSavedRedirectRouteAndNavigate(config);
          }

          if (!isAuthenticated) {
            autoLoginService.saveRedirectRoute(config, url);
            loginService.login(config);
          }

          return isAuthenticated;
        })
      );
    })
  );
}
