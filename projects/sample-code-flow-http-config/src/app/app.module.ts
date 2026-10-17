import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthConfigModule } from './auth-config.module';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, UnauthorizedComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      // No redirect to 'home' here: the config is loaded over HTTP, so checkAuth()
      // runs after the initial navigation. A redirect would move the callback
      // (?code=...) away from the configured redirect_url before it is handled.
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'forbidden', component: UnauthorizedComponent },
      { path: 'unauthorized', component: UnauthorizedComponent },
    ]),
    AuthConfigModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
