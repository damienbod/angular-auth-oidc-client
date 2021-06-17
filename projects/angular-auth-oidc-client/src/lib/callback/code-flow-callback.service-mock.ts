import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CodeFlowCallbackServiceMock {
  authenticatedCallbackWithCode(urlToCheck: string) {}
}
