import { Injectable } from '@angular/core';
import { OidcSecurityCommon } from './oidc.security.common';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class OidcSecuritySilentRenew {
    private sessionIframe: any;

    constructor(private oidcSecurityCommon: OidcSecurityCommon) {
    }

    initRenew() {
        let existsparent = window.parent.document.getElementById('myiFrameForSilentRenew');
        let exists = window.document.getElementById('myiFrameForSilentRenew');
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

    startRenew(url: string) {
        let existsparent = window.parent.document.getElementById('myiFrameForSilentRenew');
        let exists = window.document.getElementById('myiFrameForSilentRenew');
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
            }
        });
    }
}