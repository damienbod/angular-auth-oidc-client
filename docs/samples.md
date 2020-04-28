# Samples using this library


- [Code Flow with PKCE Using a configuration from an http source and silent renew](#code-flow-with-pkce-using-a-configuration-from-an-http-source-and-silent-renew)
- [Code Flow PKCE with Refresh tokens](#code-flow-pkce-with-refresh-tokens)
- [Code Flow PKCE Auto login](#code-flow-pkce-auto-login)
- [Code Flow with PKCE basic with silent renew](#code-flow-with-pkce-basic-with-silent-renew)
- [Implicit Flow with silent renew (Not recommended)](#implicit-flow-with-silent-renew-not-recommended)
- [Implicit Flow google (Not recommended)](#implicit-flow-google-not-recommended)
- [Implicit Flow Azure AD (Not recommended)](#implicit-flow-azure-ad-not-recommended)
- [Implicit Flow Azure B2C (Not recommended)](#implicit-flow-azure-b2c-not-recommended)

## Code Flow with PKCE Using a configuration from an http source and silent renew

Sometimes it is required to load a custom `.well-known/openid-configuration` from an http adress. You can load the config from your source, map it into the required format and use the `withConfig(...)` method as usual.

> There properties are just an example, you have to use yours if you are choosing this way of configuring

### App module

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, EventTypes, LogLevel, OidcConfigService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { AppComponent } from './app.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4200',
            postLogoutRedirectUri: 'https://localhost:4200',
            clientId: 'angularClient',
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4200/silent-renew.html',
            renewTimeBeforeTokenExpiresInSeconds: 10,
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            { path: '', component: AppComponent },
            { path: 'home', component: AppComponent },
            { path: 'forbidden', component: AppComponent },
            { path: 'unauthorized', component: AppComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private readonly eventService: PublicEventsService) {
        this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.ConfigLoaded))
            .subscribe((config) => {
                console.log('ConfigLoaded', config);
            });
    }
}
```

### App component

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;
        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }

    ngOnDestroy(): void {}

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}

```

### App component html

```html
<div *ngIf="isAuthenticated$ | async as isAuthenticated; else noAuth">
    <button (click)="logout()">Logout</button>
    <hr />
    Is ModuleSetup :
    <pre>{{ isModuleSetUp$ | async | json }}</pre>

    <br />

    Is Authenticated: {{ isAuthenticated }}

    <br />
    userData
    <pre>{{ userData$ | async | json }}</pre>

    <br />
</div>

<ng-template #noAuth>
    <button (click)="login()">Login</button>
    <hr />
    You are NOT authenticated
</ng-template>

Configuration loaded:
<pre>{{ configuration | json }}</pre>
```

## Code Flow PKCE with Refresh tokens

### App module

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, EventTypes, LogLevel, OidcConfigService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { AppComponent } from './app.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4204',
            postLogoutRedirectUri: 'https://localhost:4204',
            clientId: 'angularCodeRefreshTokens',
            scope: 'openid profile email taler_api offline_access',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            { path: '', component: AppComponent },
            { path: 'home', component: AppComponent },
            { path: 'forbidden', component: AppComponent },
            { path: 'unauthorized', component: AppComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private readonly eventService: PublicEventsService) {
        this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.ConfigLoaded))
            .subscribe((config) => {
                console.log('ConfigLoaded', config);
            });
    }
}

```

### App component

```typescript
import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;

        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }

    logoffAndRevokeTokens() {
        this.oidcSecurityService.logoffAndRevokeTokens().subscribe((result) => console.log(result));
    }

    revokeRefreshToken() {
        this.oidcSecurityService.revokeRefreshToken().subscribe((result) => console.log(result));
    }

    revokeAccessToken() {
        this.oidcSecurityService.revokeAccessToken().subscribe((result) => console.log(result));
    }
}

```

### App component html

```html
<div *ngIf="isAuthenticated$ | async as isAuthenticated; else noAuth">
    <button (click)="logout()">Logout</button>
    <button (click)="logoffAndRevokeTokens()">Logout and revoke tokens</button>
    <button (click)="revokeAccessToken()">Revoke access token</button>
    <button (click)="revokeRefreshToken()">Revoke refresh token</button>
    <hr />
    Is ModuleSetup :
    <pre>{{ isModuleSetUp$ | async | json }}</pre>

    <br />

    Is Authenticated: {{ isAuthenticated }}

    <br />
    userData
    <pre>{{ userData$ | async | json }}</pre>

    <br />
</div>

<ng-template #noAuth>
    <button (click)="login()">Login</button>
    <hr />
</ng-template>

Configuration loaded:
<pre>{{ configuration | json }}</pre>

```

## Code Flow PKCE Auto login

### App module

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4203',
            clientId: 'angularJwtClient',
            scope: 'openid profile email',
            responseType: 'code',
            triggerAuthorizationResultEvent: true,
            postLogoutRedirectUri: 'https://localhost:4203/unauthorized',
            startCheckSession: false,
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4203/silent-renew.html',
            postLoginRoute: '/home',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            logLevel: LogLevel.Debug,
            historyCleanupOff: true,
            // iss_validation_off: false
            // disable_iat_offset_validation: true
        });
}

@NgModule({
    imports: [BrowserModule, routing, HttpClientModule, AuthModule.forRoot()],
    declarations: [AppComponent, ForbiddenComponent, HomeComponent, AutoLoginComponent, NavigationComponent, UnauthorizedComponent],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

```

### App component

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    ngOnInit() {
        this.oidcSecurityService
            .checkAuth()

            .subscribe((isAuthenticated) => {
                if (!isAuthenticated) {
                    if ('/autologin' !== window.location.pathname) {
                        this.write('redirect', window.location.pathname);
                        this.router.navigate(['/autologin']);
                    }
                }
                if (isAuthenticated) {
                    this.navigateToStoredEndpoint();
                }
            });
    }

    login() {
        console.log('start login');
        this.oidcSecurityService.authorize();
    }

    refreshSession() {
        console.log('start refreshSession');
        this.oidcSecurityService.authorize();
    }

    logout() {
        console.log('start logoff');
        this.oidcSecurityService.logoff();
    }

    private navigateToStoredEndpoint() {
        const path = this.read('redirect');

        if (this.router.url === path) {
            return;
        }

        if (path.toString().includes('/unauthorized')) {
            this.router.navigate(['/']);
        } else {
            this.router.navigate([path]);
        }
    }

    private read(key: string): any {
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }

        return;
    }

    private write(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

```

### Auto login component

```typescript
import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-auto-component',
    templateUrl: './auto-login.component.html',
})
export class AutoLoginComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.authorize();
    }
}

```

### Guard

```typescript
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // return checkAuth() again should be possible
        return this.oidcSecurityService.isAuthenticated$.pipe(
            map((isAuthorized: boolean) => {
                console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);

                if (!isAuthorized) {
                    this.router.navigate(['/unauthorized']);
                    return false;
                }

                return true;
            })
        );
    }
}

```

## Code Flow with PKCE basic with silent renew

> It is recomended flow in SPA applications, see [SECURELY USING THE OIDC AUTHORIZATION CODE FLOW AND A PUBLIC CLIENT WITH SINGLE PAGE APPLICATIONS](https://medium.com/@robert.broeckelmann/securely-using-the-oidc-authorization-code-flow-and-a-public-client-with-single-page-applications-55e0a648ab3a).
>
> Not all security service providers and servers support it yet.

Create the login, logout component and use the oidcSecurityService

### App module
```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, EventTypes, LogLevel, OidcConfigService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { AppComponent } from './app.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4200',
            postLogoutRedirectUri: 'https://localhost:4200',
            clientId: 'angularClient',
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4200/silent-renew.html',
            renewTimeBeforeTokenExpiresInSeconds: 10,
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            { path: '', component: AppComponent },
            { path: 'home', component: AppComponent },
            { path: 'forbidden', component: AppComponent },
            { path: 'unauthorized', component: AppComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private readonly eventService: PublicEventsService) {
        this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.ConfigLoaded))
            .subscribe((config) => {
                console.log('ConfigLoaded', config);
            });
    }
}
```

### App component

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;
        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }

    ngOnDestroy(): void {}

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}

```

### App component html

```html
<div *ngIf="isAuthenticated$ | async as isAuthenticated; else noAuth">
    <button (click)="logout()">Logout</button>
    <hr />
    Is ModuleSetup :
    <pre>{{ isModuleSetUp$ | async | json }}</pre>

    <br />

    Is Authenticated: {{ isAuthenticated }}

    <br />
    userData
    <pre>{{ userData$ | async | json }}</pre>

    <br />
</div>

<ng-template #noAuth>
    <button (click)="login()">Login</button>
    <hr />
    You are NOT authenticated
</ng-template>

Configuration loaded:
<pre>{{ configuration | json }}</pre>

```


## Implicit Flow with silent renew (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### App module

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, EventTypes, LogLevel, OidcConfigService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { AppComponent } from './app.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4202',
            postLogoutRedirectUri: 'https://localhost:4202',
            clientId: 'angularImplicitClient',
            scope: 'openid profile email',
            responseType: 'id_token token',
            startCheckSession: true,
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4202/silent-renew.html',
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            { path: '', component: AppComponent },
            { path: 'home', component: AppComponent },
            { path: 'forbidden', component: AppComponent },
            { path: 'unauthorized', component: AppComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private readonly eventService: PublicEventsService) {
        this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.ConfigLoaded))
            .subscribe((config) => {
                console.log('ConfigLoaded', config);
            });
    }
}
```

### App component

```typescript
import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;
    checkSessionChanged$: Observable<boolean>;
    checkSessionChanged: any;

    constructor(public oidcSecurityService: OidcSecurityService) {}
    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;
        this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;

        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }
    login() {
        console.log('start login');
        this.oidcSecurityService.authorize();
    }

    refreshSession() {
        console.log('start refreshSession');
        this.oidcSecurityService.authorize();
    }

    logout() {
        console.log('start logoff');
        this.oidcSecurityService.logoff();
    }
}

```

### App component html

```html
<button *ngIf="checkSessionChanged$ | async" (click)="login()">Refresh Session</button>

<div *ngIf="isAuthenticated$ | async as isAuthenticated; else noAuth">
    <button (click)="logout()">Logout</button>
    <hr />
    Is ModuleSetup :
    <pre>{{ isModuleSetUp$ | async | json }}</pre>

    <br />

    Is Authenticated: {{ isAuthenticated }}

    <br />
    userData
    <pre>{{ userData$ | async | json }}</pre>
    {{ checkSessionChanged }}
    <br />
</div>

<ng-template #noAuth>
    <button (click)="login()">Login</button>
    <hr />
</ng-template>

Configuration loaded:
<pre>{{ configuration | json }}</pre>
```

## Implicit Flow google (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### App module
```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://accounts.google.com',
            redirectUrl: 'https://localhost:44386',
            clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
            responseType: 'id_token token',
            scope: 'openid email profile',
            triggerAuthorizationResultEvent: true,
            postLogoutRedirectUri: 'https://localhost:44386/unauthorized',
            startCheckSession: false,
            silentRenew: false,
            silentRenewUrl: 'https://localhost:44386/silent-renew.html',
            postLoginRoute: '/home',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            logLevel: LogLevel.Debug,
            historyCleanupOff: true,
            // iss_validation_off: false
            // disable_iat_offset_validation: true
        });
}

@NgModule({
    imports: [BrowserModule, FormsModule, routing, HttpClientModule, AuthModule.forRoot()],
    declarations: [AppComponent, ForbiddenComponent, HomeComponent, AutoLoginComponent, NavigationComponent, UnauthorizedComponent],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

```


## Implicit Flow Azure AD (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### App module

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthorizationGuard } from './authorization.guard';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
            authWellknownEndpoint: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
            redirectUrl: 'https://localhost:44347',
            clientId: 'e38ea64a-2962-4cde-bfe7-dd2822fdab32',
            scope: 'openid profile email',
            responseType: 'id_token token',
            silentRenew: false,
            silentRenewUrl: 'https://localhost:44347/silent-renew.html',
            logLevel: LogLevel.Debug,
            customParams: {
                response_mode: 'fragment',
                prompt: 'consent',
            },
        });
}

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        HomeComponent,
        AutoLoginComponent,
        ForbiddenComponent,
        UnauthorizedComponent,
        ProtectedComponent,
    ],
    imports: [
        BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
        HttpClientModule,
        AuthModule.forRoot(),
        FormsModule,
        routing,
    ],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
        AuthorizationGuard,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

```


## Implicit Flow Azure B2C (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### App module
```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthorizationGuard } from './authorization.guard';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
            authWellknownEndpoint:
                'https://damienbod.b2clogin.com/damienbod.onmicrosoft.com/B2C_1_b2cpolicydamien/v2.0/.well-known/openid-configuration',
            redirectUrl: 'https://localhost:65328',
            postLogoutRedirectUri: 'https://localhost:65328',
            clientId: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
            scope: 'openid https://damienbod.onmicrosoft.com/testapi/demo.read',
            responseType: 'id_token token',
            silentRenew: false,
            autoUserinfo: false,
            silentRenewUrl: 'https://localhost:65328/silent-renew.html',
            logLevel: LogLevel.Debug,
            customParams: {
                response_mode: 'fragment',
                prompt: 'consent',
            },
        });
}

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        HomeComponent,
        AutoLoginComponent,
        ForbiddenComponent,
        UnauthorizedComponent,
        ProtectedComponent,
    ],
    imports: [
        BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
        HttpClientModule,
        AuthModule.forRoot(),
        FormsModule,
        routing,
    ],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
        AuthorizationGuard,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

```

