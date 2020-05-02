
# Migrations

## App module

### old

```typescript
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { Configuration } from './app.constants';
import { AppComponent } from './app.component';
import {
    AuthModule,
    OidcSecurityService,
    ConfigResult,
    OidcConfigService,
    OpenIdConfiguration
} from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.load(`${window.location.origin}/api/ClientAppSettings`);
}
@NgModule({
    imports: [
        HttpClientModule,
        AuthModule.forRoot(),
        //:..
    ],

    declarations: [
        AppComponent
    ],

    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true
        },
        Configuration
    ],

    bootstrap: [AppComponent],
})

export class AppModule {

    constructor(
        private oidcSecurityService: OidcSecurityService,
        private oidcConfigService: OidcConfigService,
    ) {
        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {

            const config: OpenIdConfiguration = {
                stsServer: configResult.customConfig.stsServer,
                redirect_url: configResult.customConfig.redirect_url,
                client_id: configResult.customConfig.client_id,
                response_type: configResult.customConfig.response_type,
                scope: configResult.customConfig.scope,
                post_logout_redirect_uri: configResult.customConfig.post_logout_redirect_uri,
                start_checksession: configResult.customConfig.start_checksession,
                silent_renew: configResult.customConfig.silent_renew,
                silent_renew_url: 'https://localhost:44311/silent-renew.html',
                post_login_route: configResult.customConfig.startup_route,
                forbidden_route: configResult.customConfig.forbidden_route,
                unauthorized_route: configResult.customConfig.unauthorized_route,
                log_console_warning_active: configResult.customConfig.log_console_warning_active,
                log_console_debug_active: configResult.customConfig.log_console_debug_active,
                max_id_token_iat_offset_allowed_in_seconds: configResult.customConfig.max_id_token_iat_offset_allowed_in_seconds,
                history_cleanup_off: true
                // iss_validation_off: false
                // disable_iat_offset_validation: true
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });

        console.log('APP STARTING');
    }
}


```

### new 

```typescript
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutes } from './app.routes';
import { Configuration } from './app.constants';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { AuthModule, OidcConfigService } from 'angular-auth-oidc-client';

import { map, switchMap } from 'rxjs/operators';

export function configureAuth(oidcConfigService: OidcConfigService, httpClient: HttpClient) {
    const setupAction$ = httpClient.get<any>(`${window.location.origin}/api/ClientAppSettings`).pipe(
        map((customConfig) => {
            return {
                stsServer: customConfig.stsServer,
                redirectUrl: customConfig.redirect_url,
                clientId: customConfig.client_id,
                responseType: customConfig.response_type,
                scope: customConfig.scope,
                postLogoutRedirectUri: customConfig.post_logout_redirect_uri,
                startCheckSession: customConfig.start_checksession,
                silentRenew:  true,
                silentRenewUrl: customConfig.redirect_url + '/silent-renew.html',
                postLoginRoute: customConfig.startup_route,
                forbiddenRoute: customConfig.forbidden_route,
                unauthorizedRoute: customConfig.unauthorized_route,
                logLevel: 0, // LogLevel.Debug, // customConfig.logLevel
                maxIdTokenIatOffsetAllowedInSeconds: customConfig.max_id_token_iat_offset_allowed_in_seconds,
                historyCleanupOff: true,
                // autoUserinfo: false,
            };
        }),
        switchMap((config) => oidcConfigService.withConfig(config))
    );

    return () => setupAction$.toPromise();
}

@NgModule({
    imports: [
        HttpClientModule,
        AuthModule.forRoot(),
        CoreModule.forRoot(),
        // ...
    ],

    declarations: [
        AppComponent
    ],

    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService, HttpClient],
            multi: true,
        },
        Configuration
    ],

    bootstrap: [AppComponent],
})

export class AppModule {}

```

## App module simple

### old 

```typescript
```

### new 

```typescript
```

## App Component

## old

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-component',
    templateUrl: 'app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {

    isAuthorizedSubscription: Subscription | undefined;
    isAuthorized = false;

    constructor(public oidcSecurityService: OidcSecurityService) {
        if (this.oidcSecurityService.moduleSetup) {
            this.doCallbackLogicIfRequired();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.doCallbackLogicIfRequired();
            });
        }
    }

    ngOnInit() {
        this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
            (isAuthorized: boolean) => {
                this.isAuthorized = isAuthorized;
            });
    }

    ngOnDestroy(): void {
        if (this.isAuthorizedSubscription) {
            this.isAuthorizedSubscription.unsubscribe();
        }
    }

    private doCallbackLogicIfRequired() {
        console.log(window.location);
        // Will do a callback, if the url has a code and state parameter.
        this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
    }
}

```

### new 

```typescript
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-component',
    templateUrl: 'app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

    isAuthenticated$: Observable<boolean>;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
         this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
		 this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }
}

```


## isAuthenticated

### old

```typescript
this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
	(isAuthenticated: boolean) => {
		this.isAuthenticated = isAuthenticated;
		if (isAuthenticated) {
			console.log('isAuthenticated');
		}
	});
```


### new 

```typescript
this.oidcSecurityService.isAuthenticated$.subscribe(
	(isAuthenticated: boolean) => {
		this.isAuthenticated = isAuthenticated;
		if (isAuthenticated) {
			console.log('isAuthenticated');
		}
	});
```

## User data

### old

```typescript
this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(
	(userData: any) => {

		console.log('userData got data');
	});
```

## new 

```typescript
 this.oidcSecurityService.userData$.subscribe(
	(userData: any) => {

		console.log('userData got data');
	});
```