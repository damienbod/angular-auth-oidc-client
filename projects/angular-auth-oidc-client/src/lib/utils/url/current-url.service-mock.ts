import { Injectable } from '@angular/core';

@Injectable()
export class CurrentUrlServiceMock {
  getStateParamFromCurrentUrl(): string {
    return null;
  }

  currentUrlHasStateParam(): boolean {
    return false;
  }

  getCurrentUrl(): string {
    return null;
  }
}
