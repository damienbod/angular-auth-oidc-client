import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { PopupResult } from './popup-result';
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
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(true);

      const result = popUpService.isCurrentlyInPopup();

      expect(result).toBe(true);
    });

    it('returns false if there is no opener', () => {
      spyOnProperty(window, 'opener').and.returnValue(null);

      const result = popUpService.isCurrentlyInPopup();

      expect(result).toBe(false);
    });
  });

  describe('result$', () => {
    it(
      'emits when internal subject is called',
      waitForAsync(() => {
        const popupResult: PopupResult = { userClosed: false, receivedUrl: 'some-url1111' };

        popUpService.result$.subscribe((result) => {
          expect(result).toBe(popupResult);
        });

        (popUpService as any).resultInternal$.next(popupResult);
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
              closed: true,
              close: () => {},
            } as Window)
        );
        popUpService.openPopUp('url');

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=500,height=500,left=150,top=50');
      })
    );

    it(
      'popup opens with parameters and passed options',
      waitForAsync(() => {
        const popupSpy = spyOn(window, 'open').and.callFake(
          () =>
            ({
              sessionStorage: mockStorage,
              closed: true,
              close: () => {},
            } as Window)
        );
        popUpService.openPopUp('url', { width: 100 });

        expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', 'width=100,height=500,left=350,top=50');
      })
    );

    describe('popup closed', () => {
      let popup: Window;
      let popupResult: PopupResult;
      let cleanUpSpy: jasmine.Spy;

      beforeEach(() => {
        popup = {
          sessionStorage: mockStorage,
          closed: false,
          close: () => {},
        } as Window;

        spyOn(window, 'open').and.returnValue(popup);

        cleanUpSpy = spyOn(popUpService as any, 'cleanUp').and.callThrough();

        popupResult = undefined;

        popUpService.result$.subscribe((result) => (popupResult = result));
      });

      it('message received', fakeAsync(() => {
        let listener: (event: MessageEvent) => void;

        spyOn(window, 'addEventListener').and.callFake((_, func) => (listener = func));

        popUpService.openPopUp('url');

        expect(popupResult).toBeUndefined();
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        tick(200);

        expect(popupResult).toEqual({ userClosed: false, receivedUrl: 'some-url1111' });
        expect(cleanUpSpy).toHaveBeenCalledWith(listener);
      }));

      it('user closed', fakeAsync(() => {
        popUpService.openPopUp('url');

        expect(popupResult).toBeUndefined();
        expect(cleanUpSpy).not.toHaveBeenCalled();

        (popup as any).closed = true;

        tick(200);

        expect(popupResult).toEqual({ userClosed: true });
        expect(cleanUpSpy).toHaveBeenCalled();
      }));
    });
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
