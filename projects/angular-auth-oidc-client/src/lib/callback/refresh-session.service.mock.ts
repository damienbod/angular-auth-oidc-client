import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RefreshSessionServiceMock {
  forceRefreshSession(configId: string, customParams?: { [key: string]: string | number | boolean }) {}
  userForceRefreshSession(configId: string, customParams?: { [key: string]: string | number | boolean }) {}
}
