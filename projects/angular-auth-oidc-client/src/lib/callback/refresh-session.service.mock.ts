import { Injectable } from '@angular/core';

export const MAX_RETRY_ATTEMPTS = 3;
@Injectable({ providedIn: 'root' })
export class RefreshSessionServiceMock {
  forceRefreshSession(customParams?: { [key: string]: string | number | boolean }) {}
}
