import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { AutoLoginService } from './auto-login.service';
import {AuthOptions} from '../auth-options';

@Injectable({ providedIn: 'root' })
export class AutoLoginPartialRoutesGuard  {
  constructor(
    private readonly autoLoginService: AutoLoginService,
    private readonly authStateService: AuthStateService,
    private readonly loginService: LoginService,
    private readonly configurationService: ConfigurationService,
    private readonly router: Router
  ) {}

  canLoad(): Observable<boolean> {
    return this.checkAuth(this.router.getCurrentNavigation()?.extractedUrl.toString().substring(1) ?? '');
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return route?.data ? this.checkAuth(state.url,{customParams:route.data}): this.checkAuth(state.url)
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    return route?.data ? this.checkAuth(state.url,{customParams:route.data}): this.checkAuth(state.url)
  }

  private checkAuth(url: string,authOptions?:AuthOptions): Observable<boolean> {
    return this.configurationService.getOpenIDConfiguration().pipe(
      map((configuration) => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configuration);

        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(configuration);
        }

        if (!isAuthenticated) {
          this.autoLoginService.saveRedirectRoute(configuration, url);
          if(authOptions){
            this.loginService.login(configuration,authOptions);
          }
          else{
            this.loginService.login(configuration);
          }

        }

        return isAuthenticated;
      })
    );
  }
}
