import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImplicitFlowCallbackServiceMock {
  authorizedImplicitFlowCallback(hash?: string) {}
}
