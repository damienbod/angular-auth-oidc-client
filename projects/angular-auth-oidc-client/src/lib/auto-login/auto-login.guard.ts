import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AutoLoginService } from '../auto-login/auto-login-service';
import { CheckAuthService } from '../check-auth.service';
import { LoginService } from '../login/login.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginGuard implements CanActivate, CanLoad {
  constructor(
    private autoLoginService: AutoLoginService,
    private authStateService: AuthStateService,
    private checkAuthService: CheckAuthService,
    private loginService: LoginService,
    private router: Router
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    return this.checkAuth(route.path);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string) {
    return this.authStateService.authorized$.pipe(
      concatMap((isAuthenticatedAlready) => (isAuthenticatedAlready ? of(isAuthenticatedAlready) : this.checkAuthService.checkAuth())),

      map((isAuthorized) => {
        const storedRoute = this.autoLoginService.getStoredRedirectRoute();

        if (isAuthorized) {
          if (storedRoute) {
            this.autoLoginService.deleteStoredRedirectRoute();
            this.router.navigate([storedRoute]);
          }
          return true;
        }

        this.autoLoginService.saveStoredRedirectRoute(url);
        this.loginService.login();
        return false;
      })
    );
  }
}
