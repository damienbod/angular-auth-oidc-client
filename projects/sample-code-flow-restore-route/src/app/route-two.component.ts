import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-route-two',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Route two</h2>
    <p>This route is also available before and after login.</p>
  `,
})
export class RouteTwoComponent {}
