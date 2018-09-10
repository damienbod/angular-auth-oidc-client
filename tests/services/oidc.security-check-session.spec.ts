import { TestBed } from '@angular/core/testing';
import {
    AuthConfiguration,
    AuthWellKnownEndpoints,
    DefaultConfiguration,
    OidcSecurityService,
    OidcSecurityStorage,
} from '../../src/angular-auth-oidc-client';
import { LoggerService } from '../../src/services/oidc.logger.service';
import { OidcSecurityCheckSession } from '../../src/services/oidc.security.check-session';
import { OidcSecurityCommon } from '../../src/services/oidc.security.common';
import { TestStorage } from '../common/test-storage.service';

describe('EqualityHelperServiceTests', () => {
    let oidcSecurityCheckSession: OidcSecurityCheckSession;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OidcSecurityCheckSession,
                AuthConfiguration,
                OidcSecurityCommon,
                LoggerService,
                DefaultConfiguration,
                OidcSecurityService,
                { provide: OidcSecurityStorage, useClass: TestStorage },
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityCheckSession = TestBed.get(OidcSecurityCheckSession);
    });

    it('should create', () => {
        expect(oidcSecurityCheckSession).toBeTruthy();
    });

    it('setupModule sets authWellKnownEndpoints create', () => {
        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints).toBe(undefined);
        const authWellKnownEndpoints = new AuthWellKnownEndpoints();
        authWellKnownEndpoints.issuer = 'testIssuer';
        oidcSecurityCheckSession.setupModule(authWellKnownEndpoints);

        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints).toBeTruthy();
        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints.issuer).toBe('testIssuer');
    });

    it('doesSessionExist', () => {
        console.log(window.parent.document);
    });

    // doesSessionExist(): boolean {
    //     let existsparent = undefined;
    //     try {
    //         const parentdoc = window.parent.document;
    //         if (!parentdoc) {
    //             throw new Error('Unaccessible');
    //         }

    //         existsparent = parentdoc.getElementById('myiFrameForCheckSession');
    //     } catch (e) {
    //         // not accessible
    //     }
    //     const exists = window.document.getElementById('myiFrameForCheckSession');
    //     if (existsparent) {
    //         this.sessionIframe = existsparent;
    //     } else if (exists) {
    //         this.sessionIframe = exists;
    //     }

    //     if (existsparent || exists) {
    //         return true;
    //     }

    //     return false;
    // }
});
