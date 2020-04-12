import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthModule,
  ConfigResult,
  OidcConfigService,
  OidcSecurityService,
  OpenIdConfiguration } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { NavigationComponent } from './navigation/navigation.component';
import { HomeComponent } from './home/home.component';

@NgModule({
    declarations: [
      AppComponent,
      ForbiddenComponent,
      AutoLoginComponent,
      UnauthorizedComponent,
      NavigationComponent,
      HomeComponent ],
    imports: [
      BrowserModule,
      HttpClientModule,
      RouterModule.forRoot([
          { path: '', component: AppComponent },
          { path: 'home', component: AppComponent },
          { path: 'forbidden', component: AppComponent },
          { path: 'unauthorized', component: AppComponent },
      ])],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
