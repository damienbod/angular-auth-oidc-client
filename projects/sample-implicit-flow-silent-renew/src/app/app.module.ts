import { NgModule, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { EventTypes, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { AppComponent } from './app.component';
import { AuthConfigModule } from './auth-config.module';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, UnauthorizedComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'forbidden', component: UnauthorizedComponent },
      { path: 'unauthorized', component: UnauthorizedComponent },
    ]),
    AuthConfigModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  private readonly eventService = inject(PublicEventsService);

  constructor() {
    this.eventService
      .registerForEvents()
      .pipe(
        filter((notification) => notification.type === EventTypes.ConfigLoaded)
      )
      .subscribe((config) => console.log('ConfigLoaded', config));
  }
}
