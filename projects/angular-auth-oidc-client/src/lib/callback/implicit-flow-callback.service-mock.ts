import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImplicitFlowCallbackServiceMock {
  authenticatedImplicitFlowCallback(hash?: string) {}
}
