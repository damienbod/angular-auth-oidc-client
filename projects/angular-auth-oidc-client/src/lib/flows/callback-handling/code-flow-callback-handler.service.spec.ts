import { TestBed, waitForAsync } from '@angular/core/testing';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { CodeFlowCallbackHandlerService } from './code-flow-callback-handler.service';

describe('CodeFlowCallbackHandlerService', () => {
  let service: CodeFlowCallbackHandlerService;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CodeFlowCallbackHandlerService,
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(CodeFlowCallbackHandlerService);
    urlService = TestBed.inject(UrlService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('codeFlowCallback', () => {
    it(
      'throws error if no state is given',
      waitForAsync(() => {
        const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
        getUrlParameterSpy.withArgs('any-url', 'state').and.returnValue(null);

        (service as any).codeFlowCallback('any-url').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'throws error if no code is given',
      waitForAsync(() => {
        const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
        getUrlParameterSpy.withArgs('any-url', 'code').and.returnValue(null);

        (service as any).codeFlowCallback('any-url').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'returns callbackContext if all params are good',
      waitForAsync(() => {
        spyOn(urlService, 'getUrlParameter').and.returnValue('params');

        const expectedCallbackContext = {
          code: 'params',
          refreshToken: null,
          state: 'params',
          sessionState: 'params',
          authResult: null,
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: null,
        };

        (service as any).codeFlowCallback('any-url').subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );
  });
});
