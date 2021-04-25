import { Component, OnInit } from '@angular/core';
import { EventTypes, OidcSecurityService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  constructor(public oidcSecurityService: OidcSecurityService, private eventService: PublicEventsService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken }) => {
      console.log('app authenticated', isAuthenticated);
      console.log(`Current access token is '${accessToken}'`);
    });

    this.eventService
      .registerForEvents()
      .pipe(filter((notification) => notification.type === EventTypes.CheckSessionReceived))
      .subscribe((value) => console.log('CheckSessionReceived with value from app', value));
  }
}
