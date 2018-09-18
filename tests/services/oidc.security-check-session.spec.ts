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

    it('setupModule sets authWellKnownEndpoints', () => {
        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints).toBe(undefined);
        const authWellKnownEndpoints = new AuthWellKnownEndpoints();
        authWellKnownEndpoints.issuer = 'testIssuer';
        oidcSecurityCheckSession.setupModule(authWellKnownEndpoints);

        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints).toBeTruthy();
        expect((oidcSecurityCheckSession as any).authWellKnownEndpoints.issuer).toBe('testIssuer');
    });

    it('doesSessionExist returns false if nothing is setup', () => {
        let result = oidcSecurityCheckSession.doesSessionExist();
        expect(result).toBe(false);
    });

    it('doesSessionExist returns true if document found on window.parent.document', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.parent.document.documentElement.appendChild(node);

        let result = oidcSecurityCheckSession.doesSessionExist();
        expect(result).toBe(true);
        let remove = window.parent.document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns true if document found on window.document', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.document.documentElement.appendChild(node);
        let result = oidcSecurityCheckSession.doesSessionExist();
        expect(result).toBe(true);
        let remove = document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns false if document not found on window.parent.document given the wrong id', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'idwhichshouldneverexist');
        window.parent.document.documentElement.appendChild(node);
        let result = oidcSecurityCheckSession.doesSessionExist();
        expect(result).toBe(false);
        let remove = window.parent.document.getElementById('idwhichshouldneverexist');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns false if document not found on window.document given the wrong id', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'idwhichshouldneverexist');
        window.document.documentElement.appendChild(node);
        let result = oidcSecurityCheckSession.doesSessionExist();
        expect(result).toBe(false);

        let remove = document.getElementById('idwhichshouldneverexist');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });

    it('existsParent is set when document was found on window.parent', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.parent.document.documentElement.appendChild(node);

        oidcSecurityCheckSession.doesSessionExist();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBe(node);

        let remove = window.parent.document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('existsParent is set when document was found on window', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.document.documentElement.appendChild(node);

        oidcSecurityCheckSession.doesSessionExist();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBe(node);

        let remove = document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });
});
