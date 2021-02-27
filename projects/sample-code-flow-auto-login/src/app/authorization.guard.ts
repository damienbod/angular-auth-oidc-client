import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
  // , private router: Router
  constructor(private oidcSecurityService: OidcSecurityService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.oidcSecurityService.checkAuth().pipe(
      map((isAuthorized: boolean) => {
        console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);

        if (!isAuthorized) {
          this.write('redirect', state.url);
          this.oidcSecurityService.authorize();
          return false;
        }

        return true;
      })
    );
  }

  private write(key: string, value: any): void {
    localStorage.setItem(key, value);
  }

  // private read() {
  //   localStorage.getItem('redirect');
  // }

  // private navigateToStoredEndpoint() {
  //   const path = this.read();
  //   this.router.navigate([path]);
  // }
}
