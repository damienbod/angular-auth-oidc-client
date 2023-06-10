import { Injectable, inject } from '@angular/core';
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

export function autoLoginAllRoutesGuard(): Observable<boolean> {
  const configurationService = inject(ConfigurationService);
  const checkAuthService = inject(CheckAuthService);
  const loginService = inject(LoginService);
  const autoLoginService = inject(AutoLoginService);
  const router = inject(Router);

  const url =
    router.getCurrentNavigation()?.extractedUrl.toString().substring(1) ?? '';

  return checkAuth(
    url,
    configurationService,
    checkAuthService,
    autoLoginService,
    loginService
  );
}

// export function autoLoginAllRoutesGuard(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
//   const configurationService = inject(ConfigurationService);
//   const checkAuthService = inject(CheckAuthService);
//   const loginService = inject(LoginService);
//   const autoLoginService = inject(AutoLoginService);

//   return checkAuth(state.url, configurationService, checkAuthService, autoLoginService, loginService);
// }

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
