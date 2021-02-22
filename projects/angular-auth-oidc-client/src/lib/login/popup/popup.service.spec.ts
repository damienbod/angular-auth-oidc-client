import { TestBed, waitForAsync } from '@angular/core/testing';
import { PopUpService } from './popup.service';

describe('PopUpService', () => {
  let popUpService: PopUpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PopUpService],
    });
  });

  beforeEach(() => {
    popUpService = TestBed.inject(PopUpService);
  });

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  describe('isCurrentlyInPopup', () => {
    it('returns true if window has opener and opener does not equal the window', () => {
      spyOnProperty(window, 'opener').and.returnValue({ some: 'thing' });

      const result = popUpService.isCurrentlyInPopup();

      expect(result).toBe(true);
    });

    it('returns false if there is no opener', () => {
      spyOnProperty(window, 'opener').and.returnValue(null);

      const result = popUpService.isCurrentlyInPopup();

      expect(result).toBe(false);
    });
  });

  describe('receivedUrl$', () => {
    it(
      'emits when internal subject is called',
      waitForAsync(() => {
        popUpService.receivedUrl$.subscribe((result) => {
          expect(result).toBe(true);
        });

        (popUpService as any).receivedUrlInternal$.next(true);
      })
    );
  });

  describe('openPopup', () => {
    it(
      'popup opens with parameters and defaultoptions',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(() => null);
        popUpService.openPopUp('url');

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=500,height=500,left=50,top=50');
      })
    );

    it(
      'popup opens with parameters and passed options',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(() => null);
        popUpService.openPopUp('url', { width: 100 });

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=100,height=500,left=50,top=50');
      })
    );

    it(
      'xxx',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(() => ({ close: () => {} } as Window));
        popUpService.openPopUp('url', { width: 100 });

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=100,height=500,left=50,top=50');
      })
    );
  });

  describe('sendMessageToMainWindow', () => {
    it(
      'does nothing if window.opener is null',
      waitForAsync(() => {
        spyOnProperty(window, 'opener').and.returnValue(null);

        const sendMessageSpy = spyOn(popUpService as any, 'sendMessage');
        popUpService.sendMessageToMainWindow('');

        expect(sendMessageSpy).not.toHaveBeenCalled();
      })
    );

    it(
      'calls postMessage when window opener is given',
      waitForAsync(() => {
        spyOnProperty(window, 'opener').and.returnValue({ postMessage: () => {} });
        const sendMessageSpy = spyOn(window.opener, 'postMessage');

        popUpService.sendMessageToMainWindow('someUrl');

        expect(sendMessageSpy).toHaveBeenCalledTimes(1);
        expect(sendMessageSpy).toHaveBeenCalledWith('someUrl', jasmine.any(String));
      })
    );
  });
});
