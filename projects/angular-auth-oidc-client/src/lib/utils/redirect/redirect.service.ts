import { Injectable } from '@angular/core';

declare var window: any;

@Injectable({ providedIn: 'root' })
export class RedirectService {
    redirectTo(url) {
        window.location.href = url;
    }
}
