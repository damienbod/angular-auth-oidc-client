import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { CheckAuthService } from '../check-auth.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginAllRoutesGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private autoLoginService: AutoLoginService,
    private checkAuthService: CheckAuthService,
    private loginService: LoginService,
    private configurationService: ConfigurationService
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const routeToRedirect = segments.join('/');

    return this.checkAuth(routeToRedirect);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.checkAuth(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.configurationService.getOpenIDConfiguration().pipe(
      switchMap((config) => {
        const allconfigs = this.configurationService.getAllConfigurations();

        return this.checkAuthService.checkAuth(config, allconfigs).pipe(
          take(1),
          map(({ isAuthenticated }) => {
            if (isAuthenticated) {
              this.autoLoginService.checkSavedRedirectRouteAndNavigate(config);
            }

            if (!isAuthenticated) {
              this.autoLoginService.saveRedirectRoute(config, url);
              this.loginService.login(config);
            }

            return isAuthenticated;
          })
        );
      })
    );
  }
}
