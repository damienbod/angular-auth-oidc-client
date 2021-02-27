import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CheckAuthService } from '../check-auth.service';
import { LoginService } from '../login/login.service';

const STORAGE_KEY = 'redirect';

@Injectable({ providedIn: 'root' })
export class AutoLoginGuard implements CanActivate {
  constructor(private checkAuthService: CheckAuthService, private loginService: LoginService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuthService.checkAuth().pipe(
      map((isAuthorized: boolean) => {
        const storedRoute = localStorage.getItem(STORAGE_KEY);

        if (isAuthorized) {
          if (storedRoute) {
            localStorage.removeItem(STORAGE_KEY);
            this.router.navigate([storedRoute]);
          }
          return true;
        }

        if (!storedRoute) {
          localStorage.setItem(STORAGE_KEY, state.url);
        }

        this.loginService.login();
        return false;
      })
    );
  }
}
