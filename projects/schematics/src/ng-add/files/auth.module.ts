import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService): () => void {
    return () => {
        oidcConfigService.withConfig({
            stsServer: 'please-enter-sts',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes',
            responseType: 'please-enter-responseType',
            silentRenew: true /* true  | false */,
            useRefreshToken: true /* true  | false */,
            renewTimeBeforeTokenExpiresInSeconds: 30,
        });
    };
}

@NgModule({
    imports: [AuthModule.forRoot()],
    exports: [AuthModule],
    declarations: [],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
})
export class AuthenticationModule {}
