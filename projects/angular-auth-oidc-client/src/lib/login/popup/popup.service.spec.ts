import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../../test/auto-mock';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopUpService } from './popup.service';

describe('PopUpService', () => {
  let popUpService: PopUpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        PopUpService,
      ],
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
    setItem: (key: string, value: string): void => {
      store[key] = `${value}`;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    length: 1,
    key: (_i): string => '',
  };

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  // describe('isCurrentlyInPopup', () => {
  //   it('returns true if window has opener, opener does not equal the window and session storage has item', () => {
  //     spyOnProperty(window, 'opener').and.returnValue({ some: 'thing' });
  //     spyOn(window.sessionStorage, 'getItem').and.returnValue('thing');
  //     spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(true);
  //     const config = {} as OpenIdConfiguration;

  //     const result = popUpService.isCurrentlyInPopup(config);

  //     expect(result).toBe(true);
  //   });

  //   it('returns false if there is no opener', () => {
  //     spyOnProperty(navigator, 'cookieEnabled').and.returnValue(false);

  //     const result = popUpService.isCurrentlyInPopup();

  //     expect(result).toBe(false);
  //   });

  //   it('returns false if can not access Session Storage', () => {
  //     spyOnProperty(window, 'opener').and.returnValue(null);

  //     const result = popUpService.isCurrentlyInPopup();

  //     expect(result).toBe(false);
  //   });
  // });

  // describe('result$', () => {
  //   it('emits when internal subject is called', waitForAsync(() => {
  //     const popupResult: PopupResult = { userClosed: false, receivedUrl: 'some-url1111' };

  //     popUpService.result$.subscribe((result) => {
  //       expect(result).toBe(popupResult);
  //     });

  //     (popUpService as any).resultInternal$.next(popupResult);
  //   }));
  // });

  // describe('openPopup', () => {
  //   it('popup opens with parameters and default options', waitForAsync(() => {
  //     const popupSpy = spyOn(window, 'open').and.callFake(
  //       () =>
  //         ({
  //           sessionStorage: mockStorage,
  //           closed: true,
  //           close: () => undefined,
  //         } as Window)
  //     );

  //     popUpService.openPopUp('url');

  //     expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', jasmine.any(String));
  //   }));

  //   it('popup opens with parameters and passed options', waitForAsync(() => {
  //     const popupSpy = spyOn(window, 'open').and.callFake(
  //       () =>
  //         ({
  //           sessionStorage: mockStorage,
  //           closed: true,
  //           close: () => undefined,
  //         } as Window)
  //     );

  //     popUpService.openPopUp('url', { width: 100 });

  //     expect(popupSpy).toHaveBeenCalledOnceWith('url', '_blank', jasmine.any(String));
  //   }));

  //   describe('popup closed', () => {
  //     let popup: Window;
  //     let popupResult: PopupResult;
  //     let cleanUpSpy: jasmine.Spy;

  //     beforeEach(() => {
  //       popup = {
  //         sessionStorage: mockStorage,
  //         closed: false,
  //         close: () => undefined,
  //       } as Window;

  //       spyOn(window, 'open').and.returnValue(popup);

  //       cleanUpSpy = spyOn(popUpService as any, 'cleanUp').and.callThrough();

  //       popupResult = undefined;

  //       popUpService.result$.subscribe((result) => (popupResult = result));
  //     });

  //     it('message received with data', fakeAsync(() => {
  //       let listener: (event: MessageEvent) => void;

  //       spyOn(window, 'addEventListener').and.callFake((_, func) => (listener = func));

  //       popUpService.openPopUp('url');

  //       expect(popupResult).toBeUndefined();
  //       expect(cleanUpSpy).not.toHaveBeenCalled();

  //       listener(new MessageEvent('message', { data: 'some-url1111' }));

  //       tick(200);

  //       expect(popupResult).toEqual({ userClosed: false, receivedUrl: 'some-url1111' });
  //       expect(cleanUpSpy).toHaveBeenCalledOnceWith(listener);
  //     }));

  //     it('message received without data does return but cleanup does not throw event', fakeAsync(() => {
  //       let listener: (event: MessageEvent) => void;

  //       spyOn(window, 'addEventListener').and.callFake((_, func) => (listener = func));
  //       const nextSpy = spyOn((popUpService as any).resultInternal$, 'next');

  //       popUpService.openPopUp('url');

  //       expect(popupResult).toBeUndefined();
  //       expect(cleanUpSpy).not.toHaveBeenCalled();

  //       listener(new MessageEvent('message', { data: null }));

  //       tick(200);

  //       expect(popupResult).toBeUndefined();
  //       expect(cleanUpSpy).toHaveBeenCalled();
  //       expect(nextSpy).not.toHaveBeenCalled();
  //     }));

  //     it('user closed', fakeAsync(() => {
  //       popUpService.openPopUp('url', {});

  //       expect(popupResult).toBeUndefined();
  //       expect(cleanUpSpy).not.toHaveBeenCalled();

  //       (popup as any).closed = true;

  //       tick(200);

  //       expect(popupResult).toEqual({ userClosed: true });
  //       expect(cleanUpSpy).toHaveBeenCalled();
  //     }));
  //   });
  // });

  // describe('sendMessageToMainWindow', () => {
  //   it('does nothing if window.opener is null', waitForAsync(() => {
  //     spyOnProperty(window, 'opener').and.returnValue(null);

  //     const sendMessageSpy = spyOn(popUpService as any, 'sendMessage');

  //     popUpService.sendMessageToMainWindow('');

  //     expect(sendMessageSpy).not.toHaveBeenCalled();
  //   }));

  //   it('calls postMessage when window opener is given', waitForAsync(() => {
  //     spyOnProperty(window, 'opener').and.returnValue({ postMessage: () => undefined });
  //     const sendMessageSpy = spyOn(window.opener, 'postMessage');

  //     popUpService.sendMessageToMainWindow('someUrl');

  //     expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  //     expect(sendMessageSpy).toHaveBeenCalledOnceWith('someUrl', jasmine.any(String));
  //   }));
  // });

  // describe('cleanUp', () => {
  //   it('calls removeEventListener on window with correct params', waitForAsync(() => {
  //     const spy = spyOn(window, 'removeEventListener').and.callFake(() => undefined);

  //     const listener = null;

  //     (popUpService as any).cleanUp(listener);

  //     expect(spy).toHaveBeenCalledTimes(1);
  //     expect(spy).toHaveBeenCalledOnceWith('message', listener, false);
  //   }));

  //   it('removes popup from sessionstorage, closes and nulls when popup is opened', waitForAsync(() => {
  //     const popupMock = { anyThing: 'truthy', sessionStorage: mockStorage, close: (): void => undefined };
  //     const removeItemSpy = spyOn(mockStorage, 'removeItem');
  //     const closeSpy = spyOn(popupMock, 'close');

  //     (popUpService as any).popUp = popupMock;
  //     (popUpService as any).cleanUp(null);

  //     expect(removeItemSpy).toHaveBeenCalledOnceWith('popupauth');
  //     expect(closeSpy).toHaveBeenCalledTimes(1);
  //     expect((popUpService as any).popUp).toBeNull();
  //   }));
  // });
});
