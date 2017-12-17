import { Injectable } from '@angular/core';
import { OidcSecurityCommon } from './oidc.security.common';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class OidcSecuritySilentRenew {
    private sessionIframe: any;

    constructor(private oidcSecurityCommon: OidcSecurityCommon) {}

    initRenew() {
        let existsparent = undefined;
        try {
            const parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }

            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        } catch (e) {
            // not accessible
        }
        const exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        } else if (exists) {
            this.sessionIframe = exists;
        }

        if (!exists && !existsparent) {
            this.sessionIframe = window.document.createElement('iframe');
            this.sessionIframe.id = 'myiFrameForSilentRenew';
            this.oidcSecurityCommon.logDebug(this.sessionIframe);
            this.sessionIframe.style.display = 'none';

            window.document.body.appendChild(this.sessionIframe);
        }
    }

    // TODO The return type of this method is never used. Is it needed?
    startRenew(url: string) {
        let existsparent = undefined;
        try {
            const parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }

            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        } catch (e) {
            // not accessible
        }
        const exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        } else if (exists) {
            this.sessionIframe = exists;
        }

        this.oidcSecurityCommon.logDebug('startRenew for URL:' + url);
        this.sessionIframe.src = url;

        return Observable.create((observer: Observer<any>) => {
            this.sessionIframe.onload = () => {
                observer.next(this);
                observer.complete();
            };
        });
    }
}
