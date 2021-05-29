import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
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

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    return this.checkAuth(route.path);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string) {
    const configId = this.getId();
    return this.authStateService.authenticated$.pipe(
      concatMap((isAuthenticatedAlready) =>
        isAuthenticatedAlready ? of(isAuthenticatedAlready) : this.checkAuthService.checkAuth(configId)
      ),

      map((isAuthorized) => {
        const storedRoute = this.autoLoginService.getStoredRedirectRoute(configId);

        if (isAuthorized) {
          if (storedRoute) {
            this.autoLoginService.deleteStoredRedirectRoute(configId);
            this.router.navigateByUrl(storedRoute);
          }
          return true;
        }

        this.autoLoginService.saveStoredRedirectRoute(configId, url);
        this.loginService.login(configId);
        return false;
      })
    );
  }

  private getId() {
    return this.configurationProvider.getAllConfigurations()[0]?.configId;
  }
}
