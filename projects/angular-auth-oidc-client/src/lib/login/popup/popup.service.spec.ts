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

  let store = {};
  const mockStorage = {
    getItem: (key: string): string => {
      return key in store ? store[key] : null;
    },
    setItem: (key: string, value: string) => {
      store[key] = `${value}`;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 1,
    key: (i) => '',
  };

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  describe('isCurrentlyInPopup', () => {
    it('returns true if window has opener, opener does not equal the window and session storage has item', () => {
      spyOnProperty(window, 'opener').and.returnValue({ some: 'thing' });
      spyOn(window.sessionStorage, 'getItem').and.returnValue('thing');

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
          expect(result).toBe('some-url1111');
        });

        (popUpService as any).receivedUrlInternal$.next('some-url1111');
      })
    );
  });

  describe('openPopup', () => {
    it(
      'popup opens with parameters and default options',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(
          () =>
            ({
              sessionStorage: mockStorage,
            } as Window)
        );
        popUpService.openPopUp('url');

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=500,height=500,left=50,top=50');
      })
    );

    it(
      'popup opens with parameters and passed options',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(
          () =>
            ({
              sessionStorage: mockStorage,
            } as Window)
        );
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

  describe('cleanUp', () => {
    it(
      'calls removeEventListener on window with correct params',
      waitForAsync(() => {
        const spy = spyOn(window, 'removeEventListener').and.callFake(() => {});

        const listener = null;
        (popUpService as any).cleanUp(listener);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('message', listener, false);
      })
    );

    it(
      'removes popup from sessionstorage, closes and nulls when popup is opened',
      waitForAsync(() => {
        const popupMock = { anyThing: 'truthy', sessionStorage: mockStorage, close: () => {} };
        const removeItemSpy = spyOn(mockStorage, 'removeItem');
        const closeSpy = spyOn(popupMock, 'close');
        (popUpService as any).popUp = popupMock;
        (popUpService as any).cleanUp(null);

        expect(removeItemSpy).toHaveBeenCalledOnceWith('popupauth');
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect((popUpService as any).popUp).toBeNull();
      })
    );
  });
});
