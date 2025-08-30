import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { mockProvider } from '../../../test/auto-mock';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';

describe('PopUpService', () => {
  let popUpService: PopUpService;
  let storagePersistenceService: StoragePersistenceService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(StoragePersistenceService),
        mockProvider(LoggerService),
      ],
    });
  });

  beforeEach(() => {
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    loggerService = TestBed.inject(LoggerService);
    popUpService = TestBed.inject(PopUpService);
  });

  let store: any = {};
  const mockStorage = {
    getItem: (key: string): string | null => {
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
    key: (_i: any): string => '',
  };

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  describe('isCurrentlyInPopup', () => {
    it('returns false if can not access Session Storage', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        false
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns false if window has no opener', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('returns true if isCurrentlyInPopup', () => {
      // arrange
      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(true);
    });
  });

  describe('result$', () => {
    it('emits when internal subject is called', waitForAsync(() => {
      const popupResult: PopupResult = {
        userClosed: false,
        receivedUrl: 'some-url1111',
      };

      popUpService.result$.subscribe((result) => {
        expect(result).toBe(popupResult);
      });

      (popUpService as any).resultInternal$.next(popupResult);
    }));
  });

  describe('openPopup', () => {
    it('popup opens with parameters and default options', waitForAsync(() => {
      // arrange
      const popupSpy = spyOn(window, 'open').and.callFake(
        () =>
          ({
            closed: true,
            close: () => undefined,
          } as Window)
      );

      // act
      popUpService.openPopUp('url', {}, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledOnceWith(
        'url',
        '_blank',
        jasmine.any(String)
      );
    }));

    it('popup opens with parameters and passed options', waitForAsync(() => {
      // arrange
      const popupSpy = spyOn(window, 'open').and.callFake(
        () =>
          ({
            closed: true,
            close: () => undefined,
          } as Window)
      );

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledOnceWith(
        'url',
        '_blank',
        jasmine.any(String)
      );
    }));

    it('logs error and return if popup could not be opened', () => {
      // arrange
      spyOn(window, 'open').and.callFake(() => null);
      const loggerSpy = spyOn(loggerService, 'logError');

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(loggerSpy).toHaveBeenCalledOnceWith(
        { configId: 'configId1' },
        'Could not open popup'
      );
    });

    describe('popup closed', () => {
      let popup: Window;
      let popupResult: PopupResult;
      let cleanUpSpy: jasmine.Spy;

      beforeEach(() => {
        popup = {
          closed: false,
          close: () => undefined,
        } as Window;

        spyOn(window, 'open').and.returnValue(popup);

        cleanUpSpy = spyOn(popUpService as any, 'cleanUp').and.callThrough();

        popupResult = {} as PopupResult;

        popUpService.result$.subscribe((result) => (popupResult = result));
      });

      it('message received with data', fakeAsync(() => {
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        spyOn(window, 'addEventListener').and.callFake(
          (_: any, func: any) => (listener = func)
        );

        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        tick(200);

        expect(popupResult).toEqual({
          userClosed: false,
          receivedUrl: 'some-url1111',
        });
        expect(cleanUpSpy).toHaveBeenCalledOnceWith(listener, {
          configId: 'configId1',
        });
      }));

      it('message received without data does return but cleanup does not throw event', fakeAsync(() => {
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        spyOn(window, 'addEventListener').and.callFake(
          (_: any, func: any) => (listener = func)
        );
        const nextSpy = spyOn((popUpService as any).resultInternal$, 'next');

        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: null }));

        tick(200);

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
      }));

      it('user closed', fakeAsync(() => {
        popUpService.openPopUp('url', undefined, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        (popup as any).closed = true;

        tick(200);

        expect(popupResult).toEqual({
          userClosed: true,
          receivedUrl: '',
        } as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
      }));
    });
  });

  describe('sendMessageToMainWindow', () => {
    it('does nothing if window.opener is null', waitForAsync(() => {
      // arrange
      spyOnProperty(window, 'opener').and.returnValue(null);

      const sendMessageSpy = spyOn(popUpService as any, 'sendMessage');

      // act
      popUpService.sendMessageToMainWindow('', {});

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
    }));

    it('calls postMessage when window opener is given', waitForAsync(() => {
      // arrange
      spyOnProperty(window, 'opener').and.returnValue({
        postMessage: () => undefined,
      });
      const sendMessageSpy = spyOn(window.opener, 'postMessage');

      // act
      popUpService.sendMessageToMainWindow('someUrl', {});

      // assert
      expect(sendMessageSpy).toHaveBeenCalledOnceWith(
        'someUrl',
        jasmine.any(String)
      );
    }));
  });

  describe('cleanUp', () => {
    it('calls removeEventListener on window with correct params', waitForAsync(() => {
      // arrange
      const spy = spyOn(window, 'removeEventListener').and.callFake(
        () => undefined
      );
      const listener: any = null;

      // act
      (popUpService as any).cleanUp(listener, { configId: 'configId1' });

      // assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledOnceWith('message', listener, false);
    }));

    it('removes popup from sessionstorage, closes and nulls when popup is opened', waitForAsync(() => {
      // arrange
      const popupMock = {
        anyThing: 'truthy',
        sessionStorage: mockStorage,
        close: (): void => undefined,
      };
      const removeItemSpy = spyOn(storagePersistenceService, 'remove');
      const closeSpy = spyOn(popupMock, 'close');

      // act
      (popUpService as any).popUp = popupMock;
      (popUpService as any).cleanUp(null, { configId: 'configId1' });

      // assert
      expect(removeItemSpy).toHaveBeenCalledOnceWith('popupauth', {
        configId: 'configId1',
      });
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect((popUpService as any).popUp).toBeNull();
    }));
  });
});
