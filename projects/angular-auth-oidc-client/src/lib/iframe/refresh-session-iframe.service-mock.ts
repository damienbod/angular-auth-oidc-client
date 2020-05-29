import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshSessionIframeServiceMock {
    refreshSessionWithIframe(): Observable<boolean> {
        return null;
    }
}
