import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
  constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.oidcSecurityService.checkAuth().pipe(
      map((isAuthorized: boolean) => {
        console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
        const storedRoute = this.read();

        if (isAuthorized) {
          if (storedRoute) {
            localStorage.removeItem('redirect');
            this.router.navigate([storedRoute]);
          }
          return true;
        }

        if (!storedRoute) {
          this.write(state.url);
        }

        this.oidcSecurityService.authorize();
        return false;
      })
    );
  }

  private write(value: any): void {
    localStorage.setItem('redirect', value);
  }

  private read() {
    return localStorage.getItem('redirect');
  }

  // private navigateToStoredEndpoint() {
  //   const path = this.read();
  //   this.router.navigate([path]);
  // }
}
