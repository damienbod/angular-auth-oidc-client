import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformProvider {
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor(@Inject(PLATFORM_ID) private readonly platformId: string) {}
}
