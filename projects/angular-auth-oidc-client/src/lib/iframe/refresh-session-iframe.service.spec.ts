import { TestBed, waitForAsync } from '@angular/core/testing';
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
  let silentRenewService: SilentRenewService;

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
    silentRenewService = TestBed.inject(SilentRenewService);
    urlService = TestBed.inject(UrlService);
  });

  it('should create', () => {
    expect(refreshSessionIframeService).toBeTruthy();
  });

  describe('refreshSessionWithIframe', () => {
    it(
      'calls sendAuthorizeRequestUsingSilentRenew with created url',
      waitForAsync(() => {
        spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
        const sendAuthorizeRequestUsingSilentRenewSpy = spyOn(
          refreshSessionIframeService as any,
          'sendAuthorizeRequestUsingSilentRenew'
        ).and.returnValue(of(null));

        refreshSessionIframeService.refreshSessionWithIframe('configId').subscribe(() => {
          expect(sendAuthorizeRequestUsingSilentRenewSpy).toHaveBeenCalledWith('a-url');
        });
      })
    );

    it(
      'returns correct observable',
      waitForAsync(() => {
        spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
        const sessionIFrame = document.createElement('iframe');
        sessionIFrame.onload = () => {
          // contentWindow is set!
        };
        sessionIFrame.src = 'about:blank';
        document.body.appendChild(sessionIFrame);

        const addEventListenerSpy = spyOn(sessionIFrame, 'addEventListener');

        spyOn(silentRenewService, 'getOrCreateIframe').and.returnValue(sessionIFrame);

        spyOn(refreshSessionIframeService as any, 'sendAuthorizeRequestUsingSilentRenew').and.callThrough();

        refreshSessionIframeService.refreshSessionWithIframe('configId').subscribe((result) => {
          expect(result).toBeTrue();
          expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
        });
      })
    );
  });

  describe('initSilentRenewRequest', () => {
    it(
      'dispatches customevent to window object',
      waitForAsync(() => {
        const dispatchEventSpy = spyOn(window, 'dispatchEvent');

        (refreshSessionIframeService as any).initSilentRenewRequest();

        expect(dispatchEventSpy).toHaveBeenCalledWith(
          new CustomEvent('oidc-silent-renew-init', {
            detail: jasmine.any(Number),
          })
        );
      })
    );
  });
});
