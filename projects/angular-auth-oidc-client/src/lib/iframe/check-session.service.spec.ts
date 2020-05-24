import { async, TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { OidcSecurityService } from '../oidc.security.service';
import { PublicEventsService } from '../public-events/public-events.service';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { BrowserStorageMock } from '../storage/browser-storage.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { CheckSessionService } from './check-session.service';
import { IFrameService } from './existing-iframe.service';

describe('SecurityCheckSessionTests', () => {
    let checkSessionService: CheckSessionService;
    let loggerService: LoggerService;
    let configurationProvider: ConfigurationProvider;
    let iFrameService: IFrameService;
    let storagePersistanceService: StoragePersistanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CheckSessionService,
                ConfigurationProvider,
                OidcSecurityService,
                IFrameService,
                PublicEventsService,
                {
                    provide: StoragePersistanceService,
                    useClass: StoragePersistanceServiceMock,
                },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
                { provide: PlatformProvider, useClass: PlatformProviderMock },
            ],
        });
    });

    beforeEach(() => {
        checkSessionService = TestBed.inject(CheckSessionService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        loggerService = TestBed.inject(LoggerService);
        iFrameService = TestBed.inject(IFrameService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
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

        // reset config after each test
        configurationProvider.setConfig(null);
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

        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(authWellKnownEndpoints);
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
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ checkSessionIframe: undefined });
        (checkSessionService as any).init();

        expect(spyLogWarning).toHaveBeenCalledWith('init check session: checkSessionIframe is not configured to run');
    });

    it('start() calls pollserversession() with clientId if no scheduledheartbeat is set', () => {
        const spy = spyOn<any>(checkSessionService, 'pollServerSession');
        configurationProvider.setConfig({ clientId: 'clientId' });
        checkSessionService.start();
        expect(spy).toHaveBeenCalledWith('clientId');
    });

    it('start() does not call pollserversession() if scheduledHeartBeatRunning is set', () => {
        const spy = spyOn<any>(checkSessionService, 'pollServerSession');
        (checkSessionService as any).scheduledHeartBeatRunning = () => {};
        checkSessionService.start();
        expect(spy).not.toHaveBeenCalled();
    });

    it('stopCheckingSession sets heartbeat to null', () => {
        (checkSessionService as any).scheduledHeartBeatRunning = setTimeout(() => {}, 999);
        checkSessionService.stop();
        const heartBeat = (checkSessionService as any).scheduledHeartBeatRunning;
        expect(heartBeat).toBeNull();
    });

    it('stopCheckingSession does nothing if scheduledHeartBeatRunning is not set', () => {
        (checkSessionService as any).scheduledHeartBeatRunning = null;
        const spy = spyOn<any>(checkSessionService, 'clearScheduledHeartBeat');
        checkSessionService.stop();
        expect(spy).not.toHaveBeenCalledWith();
    });

    describe('serverStateChanged', () => {
        it('returns false if startCheckSession is not configured', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ startCheckSession: false });
            const result = checkSessionService.serverStateChanged();
            expect(result).toBeFalsy();
        });

        it('returns false if checkSessionReceived is false', () => {
            (checkSessionService as any).checkSessionReceived = false;
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ startCheckSession: true });
            const result = checkSessionService.serverStateChanged();
            expect(result).toBeFalse();
        });

        it('returns true if startCheckSession is configured and checkSessionReceived is true', () => {
            (checkSessionService as any).checkSessionReceived = true;
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ startCheckSession: true });
            const result = checkSessionService.serverStateChanged();
            expect(result).toBeTrue();
        });
    });
});
