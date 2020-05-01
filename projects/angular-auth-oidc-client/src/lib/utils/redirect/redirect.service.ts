import { Inject, Injectable } from '@angular/core';
import { WINDOW } from '../window/window.reference';

@Injectable({ providedIn: 'root' })
export class RedirectService {
    constructor(@Inject(WINDOW) private window: any) {}

    redirectTo(url) {
        this.window.location.href = url;
    }
}
