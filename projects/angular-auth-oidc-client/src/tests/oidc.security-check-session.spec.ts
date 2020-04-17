import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../lib/config';
import { LoggerService } from '../lib/logging/logger.service';
import { TestLogging } from '../lib/logging/logger.service-mock';
import { IFrameService } from '../lib/services/existing-iframe.service';
import { OidcSecurityCheckSession } from '../lib/services/oidc.security.check-session';
import { OidcSecurityService } from '../lib/services/oidc.security.service';
import { AbstractSecurityStorage, StoragePersistanceService } from '../lib/storage';
import { BrowserStorageMock } from '../lib/storage/browser-storage.service-mock';

describe('SecurityCheckSessionTests', () => {
    let oidcSecurityCheckSession: OidcSecurityCheckSession;
    let loggerService: LoggerService;
    let configurationProvider: ConfigurationProvider;
    let iFrameService: IFrameService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OidcSecurityCheckSession,
                ConfigurationProvider,
                StoragePersistanceService,
                { provide: LoggerService, useClass: TestLogging },
                OidcSecurityService,
                { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
                IFrameService,
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityCheckSession = TestBed.inject(OidcSecurityCheckSession);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        loggerService = TestBed.inject(LoggerService);
        iFrameService = TestBed.inject(IFrameService);
    });

    afterEach(() => {
        const iFrameIdwhichshouldneverexist = window.document.getElementById('idwhichshouldneverexist');
        if (iFrameIdwhichshouldneverexist) {
            iFrameIdwhichshouldneverexist.parentNode.removeChild(iFrameIdwhichshouldneverexist);
        }
        const myiFrameForCheckSession = window.document.getElementById('myiFrameForCheckSession');
        if (myiFrameForCheckSession) {
            myiFrameForCheckSession.parentNode.removeChild(myiFrameForCheckSession);
        }
    });

    it('should create', () => {
        expect(oidcSecurityCheckSession).toBeTruthy();
    });

    it('getOrCreateIframe returns false if nothing is setup', () => {
        const result: IFrameService = (oidcSecurityCheckSession as any).getOrCreateIframe();
        expect(result).toBeDefined();
    });

    it('getOrCreateIframe returns true if document found on window.document', () => {
        iFrameService.addIFrameToWindowBody('myiFrameForCheckSession');

        const result: IFrameService = (oidcSecurityCheckSession as any).getOrCreateIframe();
        expect(result).toBeDefined();
    });

    it('getOrCreateIframe returns true if document found on window.parent.document', () => {
        iFrameService.addIFrameToWindowBody('myiFrameForCheckSession');

        const result: IFrameService = (oidcSecurityCheckSession as any).getOrCreateIframe();
        expect(result).toBeDefined();
    });

    // it('location of iframe is set to authWellKnownEndpoints.check_session_iframe if existing', () => {
    //     const authWellKnownEndpoints = {
    //         checkSessionIframe: 'someTestingValue',
    //     };

    //     configurationProvider.setConfig(null, authWellKnownEndpoints);
    //     spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

    //     (oidcSecurityCheckSession as any).init();
    //     expect((oidcSecurityCheckSession as any).getOrCreateIframe().contentWindow.location.toString()).toContain('someTestingValue');
    // });

    // it('init appends iframe on body with correct values', () => {
    //     expect((oidcSecurityCheckSession as any).sessionIframe).toBeFalsy();

    //     (oidcSecurityCheckSession as any).init();
    //     spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

    //     expect((oidcSecurityCheckSession as any).sessionIframe).toBeTruthy();
    //     const sessionIframe = (oidcSecurityCheckSession as any).sessionIframe;
    //     expect(sessionIframe.id).toBe('myiFrameForCheckSession');
    //     expect(sessionIframe.style.display).toBe('none');
    //     const iFrame = document.getElementById('myiFrameForCheckSession');
    //     expect(iFrame).toBeDefined();
    // });

    // it('log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
    //     const spy = spyOn<any>(oidcSecurityCheckSession, 'doesSessionExist').and.returnValue(false);
    //     const spyLogWarning = spyOn<any>(loggerService, 'logWarning');
    //     spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});
    //     configurationProvider.setConfig(null, { checkSessionIframe: undefined });
    //     (oidcSecurityCheckSession as any).init();

    //     expect(spy).toHaveBeenCalled();
    //     expect(spyLogWarning).toHaveBeenCalledWith('init check session: authWellKnownEndpoints is undefined');
    // });

    it('startCheckingSession calls pollserversession with clientId if no scheduledheartbeat is set', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'pollServerSession');
        oidcSecurityCheckSession.start('anyId');
        expect(spy).toHaveBeenCalledWith('anyId');
    });

    it('startCheckingSession does not call pollserversession if scheduledHeartBeatRunning is set', () => {
        const spy = spyOn<any>(oidcSecurityCheckSession, 'pollServerSession');
        (oidcSecurityCheckSession as any).scheduledHeartBeatRunning = () => {};
        oidcSecurityCheckSession.start('anyId');
        expect(spy).not.toHaveBeenCalled();
    });

    it('stopCheckingSession sets heartbeat to null', () => {
        (oidcSecurityCheckSession as any).scheduledHeartBeatRunning = setTimeout(() => {}, 999);
        oidcSecurityCheckSession.stop();
        const heartBeat = (oidcSecurityCheckSession as any).scheduledHeartBeatRunning;
        expect(heartBeat).toBeNull();
    });
});
