import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { RefreshSessionIframeService } from './refresh-session-iframe.service';
import { SilentRenewService } from './silent-renew.service';
import { SilentRenewServiceMock } from './silent-renew.service-mock';

describe('RefreshSessionIframeService ', () => {
    let refreshSessionIframeService: RefreshSessionIframeService;
    let urlService: UrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RefreshSessionIframeService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: SilentRenewService, useClass: SilentRenewServiceMock },
            ],
        });
    });

    beforeEach(() => {
        refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
        urlService = TestBed.inject(UrlService);
    });

    it('should create', () => {
        expect(refreshSessionIframeService).toBeTruthy();
    });

    describe('refreshSessionWithIframe', () => {
        it('calls sendAuthorizeReqestUsingSilentRenew with created url', async(() => {
            spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
            const sendAuthorizeReqestUsingSilentRenewSpy = spyOn(
                refreshSessionIframeService as any,
                'sendAuthorizeReqestUsingSilentRenew'
            ).and.returnValue(of(null));

            refreshSessionIframeService.refreshSessionWithIframe().subscribe(() => {
                expect(sendAuthorizeReqestUsingSilentRenewSpy).toHaveBeenCalledWith('a-url');
            });
        }));
    });

    describe('sendAuthorizeReqestUsingSilentRenew', () => {
        it('calls sendAuthorizeReqestUsingSilentRenew with created url', async(() => {
            spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
            const sendAuthorizeReqestUsingSilentRenewSpy = spyOn(
                refreshSessionIframeService as any,
                'sendAuthorizeReqestUsingSilentRenew'
            ).and.returnValue(of(null));

            refreshSessionIframeService.refreshSessionWithIframe().subscribe(() => {
                expect(sendAuthorizeReqestUsingSilentRenewSpy).toHaveBeenCalledWith('a-url');
            });
        }));
    });

    describe('initSilentRenewRequest', () => {
        it('dispatches customevent to window object', async(() => {
            const dispatchEventSpy = spyOn(window, 'dispatchEvent');

            (refreshSessionIframeService as any).initSilentRenewRequest();

            expect(dispatchEventSpy).toHaveBeenCalledWith(
                new CustomEvent('oidc-silent-renew-init', {
                    detail: jasmine.any(Number),
                })
            );
        }));
    });
});
