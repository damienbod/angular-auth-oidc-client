import { async, TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { IFrameService } from '../services/existing-iframe.service';
import { OidcSecurityService } from '../services/oidc.security.service';
import { AbstractSecurityStorage, StoragePersistanceService } from '../storage';
import { BrowserStorageMock } from '../storage/browser-storage.service-mock';
import { CheckSessionService } from './check-session.service';

describe('SecurityCheckSessionTests', () => {
    let checkSessionService: CheckSessionService;
    let loggerService: LoggerService;
    let configurationProvider: ConfigurationProvider;
    let iFrameService: IFrameService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CheckSessionService,
                ConfigurationProvider,
                StoragePersistanceService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                OidcSecurityService,
                { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
                IFrameService,
            ],
        });
    });

    beforeEach(() => {
        checkSessionService = TestBed.inject(CheckSessionService);
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
        expect(checkSessionService).toBeTruthy();
    });

    it('getOrCreateIframe calls iFrameService.addIFrameToWindowBody if no Iframe exists', () => {
        spyOn(iFrameService, 'addIFrameToWindowBody').and.callThrough();

        const result = (checkSessionService as any).getOrCreateIframe();
        expect(result).toBeTruthy();
        expect(iFrameService.addIFrameToWindowBody).toHaveBeenCalled();
    });

    it('getOrCreateIframe returns true if document found on window.document', () => {
        iFrameService.addIFrameToWindowBody('myiFrameForCheckSession');

        const result = (checkSessionService as any).getOrCreateIframe();
        expect(result).toBeDefined();
    });

    /*
      THIS TEST WORKS IN WHEN DEBUGGING...location.replace
       does not return a promise or something we can wait for
    */
    xit('location of iframe is set to authWellKnownEndpoints.check_session_iframe if existing', async(async () => {
        const authWellKnownEndpoints = {
            checkSessionIframe: 'someTestingValue',
        };

        configurationProvider.setConfig(null, authWellKnownEndpoints);
        spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

        (checkSessionService as any).init();
        await Promise.resolve().then();
        const iframe = (checkSessionService as any).getOrCreateIframe();
        expect(iframe.contentWindow.location.toString()).toContain('someTestingValue');
    }));

    it('init appends iframe on body with correct values', () => {
        expect((checkSessionService as any).sessionIframe).toBeFalsy();
        spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

        (checkSessionService as any).init();
        const iframe = (checkSessionService as any).getOrCreateIframe();
        expect(iframe).toBeTruthy();
        expect(iframe.id).toBe('myiFrameForCheckSession');
        expect(iframe.style.display).toBe('none');
        const iFrame = document.getElementById('myiFrameForCheckSession');
        expect(iFrame).toBeDefined();
    });

    it('log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
        const spyLogWarning = spyOn<any>(loggerService, 'logWarning');
        spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});
        configurationProvider.setConfig(null, { checkSessionIframe: undefined });
        (checkSessionService as any).init();

        expect(spyLogWarning).toHaveBeenCalledWith('init check session: checkSessionIframe is not configured to run');
    });

    it('start() calls pollserversession() with clientId if no scheduledheartbeat is set', () => {
        const spy = spyOn<any>(checkSessionService, 'pollServerSession');
        checkSessionService.start('anyId');
        expect(spy).toHaveBeenCalledWith('anyId');
    });

    it('start() does not call pollserversession() if scheduledHeartBeatRunning is set', () => {
        const spy = spyOn<any>(checkSessionService, 'pollServerSession');
        (checkSessionService as any).scheduledHeartBeatRunning = () => {};
        checkSessionService.start('anyId');
        expect(spy).not.toHaveBeenCalled();
    });

    it('stopCheckingSession sets heartbeat to null', () => {
        (checkSessionService as any).scheduledHeartBeatRunning = setTimeout(() => {}, 999);
        checkSessionService.stop();
        const heartBeat = (checkSessionService as any).scheduledHeartBeatRunning;
        expect(heartBeat).toBeNull();
    });
});
