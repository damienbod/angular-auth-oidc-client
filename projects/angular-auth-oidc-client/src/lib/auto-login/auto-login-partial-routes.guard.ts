import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginPartialRoutesGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private autoLoginService: AutoLoginService,
    private authStateService: AuthStateService,
    private loginService: LoginService,
    private configurationService: ConfigurationService,
    private router: Router
  ) {}

  canLoad(): Observable<boolean> {
    return this.checkAuth(this.router.getCurrentNavigation()?.extractedUrl.toString().substring(1) ?? '');
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.configurationService.getOpenIDConfiguration().pipe(
      map((configuration) => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configuration);

        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(configuration);
        }

        if (!isAuthenticated) {
          this.autoLoginService.saveRedirectRoute(configuration, url);
          this.loginService.login(configuration);
        }

        return isAuthenticated;
      })
    );
  }
}
