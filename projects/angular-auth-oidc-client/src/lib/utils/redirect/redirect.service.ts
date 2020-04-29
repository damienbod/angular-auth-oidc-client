import { Inject, Injectable } from '@angular/core';
import { WindowToken } from '../window/window.reference';

@Injectable({ providedIn: 'root' })
export class RedirectService {
    constructor(@Inject(WindowToken) private window: Window) {}

    redirectTo(url) {
        this.window.location.href = url;
    }
}
