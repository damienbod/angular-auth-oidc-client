import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthConfigModule } from './auth-config.module';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({
  declarations: [AppComponent, NavMenuComponent, HomeComponent, ForbiddenComponent, UnauthorizedComponent, ProtectedComponent],
  imports: [BrowserModule, HttpClientModule, FormsModule, routing, AuthConfigModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
