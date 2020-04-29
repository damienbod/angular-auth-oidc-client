import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RedirectService {
    constructor() {}

    redirectTo(url) {
        window.location.href = url;
    }
}
