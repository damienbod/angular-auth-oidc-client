import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-route-one',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Route one</h2>
    <p>This route is available before and after login.</p>
  `,
})
export class RouteOneComponent {}
