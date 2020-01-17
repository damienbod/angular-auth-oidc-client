import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformProvider {
    get isBrowser() {
        return isPlatformBrowser(this.platformId);
    }

    // tslint:disable-next-line: ban-types
    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
}
