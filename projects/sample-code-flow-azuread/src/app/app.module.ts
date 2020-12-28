import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthConfigModule } from './auth-config.module';
import { AuthorizationGuard } from './authorization.guard';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

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
    imports: [BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }), HttpClientModule, FormsModule, routing, AuthConfigModule],
    providers: [AuthorizationGuard],
    bootstrap: [AppComponent],
})
export class AppModule {}
