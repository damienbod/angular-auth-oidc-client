import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable()
export class PlatformProvider {
  get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }
  constructor(@Inject(PLATFORM_ID) private platformId: string) {}
}
