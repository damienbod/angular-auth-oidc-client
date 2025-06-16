import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformProvider {
  private readonly platformId = inject<string>(PLATFORM_ID);

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
