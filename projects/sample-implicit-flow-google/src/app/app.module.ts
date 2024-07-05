import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthConfigModule } from './auth-config.module';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({ declarations: [
        AppComponent,
        ForbiddenComponent,
        HomeComponent,
        AutoLoginComponent,
        NavigationComponent,
        UnauthorizedComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        routing,
        AuthConfigModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
