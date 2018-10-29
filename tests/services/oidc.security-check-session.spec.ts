import { TestBed } from '@angular/core/testing';
import {
    AuthConfiguration,
    AuthWellKnownEndpoints,
    OidcSecurityService,
    OidcSecurityStorage
} from '../../src/angular-auth-oidc-client';
import { IFrameService } from '../../src/services/existing-iframe.service';
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
                OidcSecurityService,
                { provide: OidcSecurityStorage, useClass: TestStorage },
                IFrameService,
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
        let result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(false);
    });

    it('doesSessionExist returns true if document found on window.parent.document', () => {
        let node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.parent.document.documentElement.appendChild(node);

        let result = (oidcSecurityCheckSession as any).doesSessionExist();
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
        let result = (oidcSecurityCheckSession as any).doesSessionExist();
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
        let result = (oidcSecurityCheckSession as any).doesSessionExist();
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
        let result = (oidcSecurityCheckSession as any).doesSessionExist();
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

        (oidcSecurityCheckSession as any).doesSessionExist();
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

        (oidcSecurityCheckSession as any).doesSessionExist();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBe(node);

        let remove = document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });

    it('init appends iframe on body with correct values', () => {
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeFalsy();

        (oidcSecurityCheckSession as any).init();

        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        const sessionIframe = (oidcSecurityCheckSession as any).sessionIframe;
        expect(sessionIframe.id).toBe('myiFrameForCheckSession');
        expect(sessionIframe.style.display).toBe('none');
        const iFrame = document.getElementById('myiFrameForCheckSession');
        expect(iFrame).toBeDefined();
    });

    it('src of iframe is set to authWellKnownEndpoints.check_session_iframe if existing', () => {
        const authWellKnownEndpoints = new AuthWellKnownEndpoints();
        authWellKnownEndpoints.check_session_iframe = 'someTestingValue';
        (oidcSecurityCheckSession as any).authWellKnownEndpoints = authWellKnownEndpoints;

        expect((oidcSecurityCheckSession as any).sessionIframe).toBeFalsy();

        (oidcSecurityCheckSession as any).init();

        expect((oidcSecurityCheckSession as any).sessionIframe.src).toContain('someTestingValue');
    });

    it('src of iframe is empty if authWellKnownEndpoints.check_session_iframe is not existing', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'doesSessionExist').and.returnValue(false);
        (oidcSecurityCheckSession as any).init();
        expect(spy).toHaveBeenCalled();
        expect((oidcSecurityCheckSession as any).sessionIframe.src).toBe('');
    });

    it('startCheckingSession calls pollserversession with clientId if no scheduledheartbeat is set', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'pollServerSession');
        oidcSecurityCheckSession.startCheckingSession('anyId');
        expect(spy).toHaveBeenCalledWith('anyId');
    });

    it('startCheckingSession does not call pollserversession if scheduledheartbeat is set', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'pollServerSession');
        (oidcSecurityCheckSession as any).scheduledHeartBeat = () => {};
        oidcSecurityCheckSession.startCheckingSession('anyId');
        expect(spy).not.toHaveBeenCalled();
    });

    it('stopCheckingSession sets heartbeat to null', () => {
        (oidcSecurityCheckSession as any).scheduledHeartBeat = setTimeout(() => {}, 999);
        oidcSecurityCheckSession.stopCheckingSession();
        const heartBeat = (oidcSecurityCheckSession as any).scheduledHeartBeat;
        expect(heartBeat).toBeNull();
    });
});
