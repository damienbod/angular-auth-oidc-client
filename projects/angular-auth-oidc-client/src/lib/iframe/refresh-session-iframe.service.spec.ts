import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { RefreshSessionIframeService } from './refresh-session-iframe.service';
import { SilentRenewService } from './silent-renew.service';

describe('RefreshSessionIframeService ', () => {
  let refreshSessionIframeService: RefreshSessionIframeService;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshSessionIframeService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: SilentRenewService, useClass: mockClass(SilentRenewService) },
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
    it(
      'calls sendAuthorizeRequestUsingSilentRenew with created url',
      waitForAsync(() => {
        spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue(of('a-url'));
        const sendAuthorizeRequestUsingSilentRenewSpy = spyOn(
          refreshSessionIframeService as any,
          'sendAuthorizeRequestUsingSilentRenew'
        ).and.returnValue(of(null));
        const allConfigs = [{ configId: 'configId1' }];

        refreshSessionIframeService.refreshSessionWithIframe(allConfigs[0], allConfigs).subscribe(() => {
          expect(sendAuthorizeRequestUsingSilentRenewSpy).toHaveBeenCalledOnceWith('a-url', allConfigs[0], allConfigs);
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

        expect(dispatchEventSpy).toHaveBeenCalledOnceWith(
          new CustomEvent('oidc-silent-renew-init', {
            detail: jasmine.any(Number),
          })
        );
      })
    );
  });
});
