import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
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
    const routeToRedirect = segments.join('/');

    return this.checkAuth(routeToRedirect);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string) {
    const isAuthenticated = this.authStateService.areAuthStorageTokensValid();

    if (isAuthenticated) {
      this.checkAuthService.startCheckSessionAndValidation();
      return of(true);
    }

    return this.checkAuthService.checkAuth().pipe(
      map((isAuthorized) => {
        const storedRoute = this.autoLoginService.getStoredRedirectRoute();

        if (isAuthorized) {
          if (storedRoute) {
            this.autoLoginService.deleteStoredRedirectRoute();
            this.router.navigateByUrl(storedRoute);
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
