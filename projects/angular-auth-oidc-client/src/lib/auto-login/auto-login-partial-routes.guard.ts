import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthOptions } from '../auth-options';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';

@Injectable({ providedIn: 'root' })
export class AutoLoginPartialRoutesGuard {
  private readonly autoLoginService = inject(AutoLoginService);

  private readonly authStateService = inject(AuthStateService);

  private readonly loginService = inject(LoginService);

  private readonly configurationService = inject(ConfigurationService);

  private readonly router = inject(Router);

  canLoad(): Observable<boolean> {
    const url =
      this.router
        .getCurrentNavigation()
        ?.extractedUrl.toString()
        .substring(1) ?? '';

    return checkAuth(
      url,
      this.configurationService,
      this.authStateService,
      this.autoLoginService,
      this.loginService
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const authOptions: AuthOptions | undefined = route?.data
      ? { customParams: route.data }
      : undefined;

    return checkAuth(
      state.url,
      this.configurationService,
      this.authStateService,
      this.autoLoginService,
      this.loginService,
      authOptions
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const authOptions: AuthOptions | undefined = route?.data
      ? { customParams: route.data }
      : undefined;

    return checkAuth(
      state.url,
      this.configurationService,
      this.authStateService,
      this.autoLoginService,
      this.loginService,
      authOptions
    );
  }
}

export function autoLoginPartialRoutesGuard(): Observable<boolean> {
  const configurationService = inject(ConfigurationService);
  const authStateService = inject(AuthStateService);
  const loginService = inject(LoginService);
  const autoLoginService = inject(AutoLoginService);
  const router = inject(Router);

  const url =
    router.getCurrentNavigation()?.extractedUrl.toString().substring(1) ?? '';

  return checkAuth(
    url,
    configurationService,
    authStateService,
    autoLoginService,
    loginService
  );
}

function checkAuth(
  url: string,
  configurationService: ConfigurationService,
  authStateService: AuthStateService,
  autoLoginService: AutoLoginService,
  loginService: LoginService,
  authOptions?: AuthOptions
): Observable<boolean> {
  return configurationService.getOpenIDConfiguration().pipe(
    map((configuration) => {
      let configWithoutRenewTimeBefore = null

      if (configuration) {
        configWithoutRenewTimeBefore = {...configuration, renewTimeBeforeTokenExpiresInSeconds: 0}
      }

      const isAuthenticated =
        authStateService.areAuthStorageTokensValid(configWithoutRenewTimeBefore);

      if (isAuthenticated) {
        autoLoginService.checkSavedRedirectRouteAndNavigate(configuration);
      }

      if (!isAuthenticated) {
        autoLoginService.saveRedirectRoute(configuration, url);
        if (authOptions) {
          loginService.login(configuration, authOptions);
        } else {
          loginService.login(configuration);
        }
      }

      return isAuthenticated;
    })
  );
}
