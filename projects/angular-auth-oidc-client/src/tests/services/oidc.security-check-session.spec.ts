import { TestBed } from '@angular/core/testing';
import { AuthWellKnownEndpoints } from '../../lib/models/auth.well-known-endpoints';
import { AuthConfiguration } from '../../lib/modules/auth.configuration';
import { IFrameService } from '../../lib/services/existing-iframe.service';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { OidcSecurityCheckSession } from '../../lib/services/oidc.security.check-session';
import { OidcSecurityCommon } from '../../lib/services/oidc.security.common';
import { OidcSecurityService } from '../../lib/services/oidc.security.service';
import { OidcSecurityStorage } from '../../lib/services/oidc.security.storage';
import { TestStorage } from '../common/test-storage.service';

describe('EqualityHelperServiceTests', () => {
    let oidcSecurityCheckSession: OidcSecurityCheckSession;
    let loggerService: LoggerService;
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
        loggerService = TestBed.get(LoggerService);
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
        const result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(false);
    });

    it('doesSessionExist returns true if document found on window.parent.document', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.parent.document.documentElement.appendChild(node);

        const result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(true);
        const remove = window.parent.document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns true if document found on window.document', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.document.documentElement.appendChild(node);
        const result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(true);
        const remove = document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns false if document not found on window.parent.document given the wrong id', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'idwhichshouldneverexist');
        window.parent.document.documentElement.appendChild(node);
        const result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(false);
        const remove = window.parent.document.getElementById('idwhichshouldneverexist');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('doesSessionExist returns false if document not found on window.document given the wrong id', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'idwhichshouldneverexist');
        window.document.documentElement.appendChild(node);
        const result = (oidcSecurityCheckSession as any).doesSessionExist();
        expect(result).toBe(false);

        const remove = document.getElementById('idwhichshouldneverexist');
        if (remove) {
            window.document.documentElement.removeChild(remove);
        }
    });

    it('existsParent is set when document was found on window.parent', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.parent.document.documentElement.appendChild(node);

        (oidcSecurityCheckSession as any).doesSessionExist();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBe(node);

        const remove = window.parent.document.getElementById('myiFrameForCheckSession');
        if (remove) {
            window.parent.document.documentElement.removeChild(remove);
        }
    });

    it('existsParent is set when document was found on window', () => {
        const node = document.createElement('iframe');
        node.setAttribute('id', 'myiFrameForCheckSession');
        window.document.documentElement.appendChild(node);

        (oidcSecurityCheckSession as any).doesSessionExist();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
        expect((oidcSecurityCheckSession as any).sessionIframe).toBe(node);

        const remove = document.getElementById('myiFrameForCheckSession');
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

    it('location of iframe is set to authWellKnownEndpoints.check_session_iframe if existing', done => {
        const authWellKnownEndpoints = new AuthWellKnownEndpoints();
        authWellKnownEndpoints.check_session_iframe = 'someTestingValue';
        (oidcSecurityCheckSession as any).authWellKnownEndpoints = authWellKnownEndpoints;

        expect((oidcSecurityCheckSession as any).sessionIframe).toBeFalsy();

        const loaded = (oidcSecurityCheckSession as any).init();

        loaded.subscribe(() => {
            expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
            expect((oidcSecurityCheckSession as any).sessionIframe.contentWindow.location.toString()).toContain('someTestingValue');
            done();
        });
    });

    it('log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'doesSessionExist').and.returnValue(false);
        const spyLogWarning = spyOn<any>(loggerService, 'logWarning');
        (oidcSecurityCheckSession as any).init();

        expect(spy).toHaveBeenCalled();
        expect(spyLogWarning).toHaveBeenCalledWith('init check session: authWellKnownEndpoints is undefined');
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
