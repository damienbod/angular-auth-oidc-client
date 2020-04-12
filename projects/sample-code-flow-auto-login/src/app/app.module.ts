import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { NavigationComponent } from './navigation/navigation.component';
import { HomeComponent } from './home/home.component';

@NgModule({
    declarations: [AppComponent, ForbiddenComponent, AutoLoginComponent, UnauthorizedComponent, NavigationComponent, HomeComponent],
    imports: [BrowserModule, AuthModule.forRoot()],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
