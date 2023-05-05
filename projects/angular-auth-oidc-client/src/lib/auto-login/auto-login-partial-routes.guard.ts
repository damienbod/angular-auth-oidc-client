import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';
import {PeriodicallyTokenCheckService} from "../callback/periodically-token-check.service";

@Injectable({ providedIn: 'root' })
export class AutoLoginPartialRoutesGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private readonly autoLoginService: AutoLoginService,
    private readonly authStateService: AuthStateService,
    private readonly loginService: LoginService,
    private readonly configurationService: ConfigurationService,
    private readonly periodicallyTokenCheckService: PeriodicallyTokenCheckService,
    private readonly router: Router
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
    return this.configurationService.getOpenIDConfigurations().pipe(
      map(({allConfigs, currentConfig}) => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(currentConfig);

        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(currentConfig);
          this.periodicallyTokenCheckService.startTokenValidationPeriodically(allConfigs, currentConfig);
        }

        if (!isAuthenticated) {
          this.autoLoginService.saveRedirectRoute(currentConfig, url);
          this.loginService.login(currentConfig);
        }

        return isAuthenticated;
      })
    );
  }
}
