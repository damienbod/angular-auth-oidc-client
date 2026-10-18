import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../../test/auto-mock';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/services/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';

describe('PopUpService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
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
    it('should return false if can not access Session Storage', () => {
      // arrange
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        false
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue({
        opener: {} as Window,
      });
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return false if window has no opener', () => {
      // arrange
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return false if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return false if there is no popup flag in storage', () => {
      // arrange
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue({
        opener: {} as Window,
      });
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(null);
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return false if window is its own opener', () => {
      // arrange
      const windowMock: any = { opener: null };

      windowMock.opener = windowMock;
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        windowMock
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return true if isCurrentlyInPopup', () => {
      // arrange
      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue({
        opener: {} as Window,
      });
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
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
    it('should emit when internal subject is called', () => {
      // arrange
      const popupResult: PopupResult = {
        userClosed: false,
        receivedUrl: 'some-url1111',
      };
      let receivedResult: PopupResult | undefined;

      popUpService.result$.subscribe((result) => {
        receivedResult = result;
      });

      // act
      (popUpService as any).resultInternal$.next(popupResult);

      // assert
      expect(receivedResult).toBe(popupResult);
    });
  });

  describe('openPopup', () => {
    it('should open the popup with parameters and default options', () => {
      // arrange
      const popupSpy = vi.spyOn(window, 'open').mockImplementation(
        () =>
          ({
            closed: true,
            close: () => undefined,
          }) as Window
      );

      // act
      popUpService.openPopUp('url', {}, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(popupSpy).toHaveBeenCalledWith(
        'url',
        '_blank',
        expect.any(String)
      );
    });

    it('should open the popup with parameters and passed options', () => {
      // arrange
      const popupSpy = vi.spyOn(window, 'open').mockImplementation(
        () =>
          ({
            closed: true,
            close: () => undefined,
          }) as Window
      );

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(popupSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(popupSpy).toHaveBeenCalledWith(
        'url',
        '_blank',
        expect.stringContaining('width=100')
      );
    });

    it('should log error and return if popup could not be opened', () => {
      // arrange
      vi.spyOn(window, 'open').mockImplementation(() => null);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      // act
      popUpService.openPopUp('url', { width: 100 }, { configId: 'configId1' });

      // assert
      expect(loggerSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(loggerSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        'Could not open popup'
      );
    });

    it('should log error and not open or write storage if url is empty', () => {
      // arrange
      const popupSpy = vi
        .spyOn(window, 'open')
        .mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      // act
      popUpService.openPopUp('', {}, { configId: 'configId1' });

      // assert
      expect(loggerSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(loggerSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        'Could not open popup, url is empty'
      );
      expect(popupSpy).not.toHaveBeenCalled();
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      // act
      popUpService.openPopUp('url', {}, { configId: 'configId1' });

      // assert
      expect(writeSpy).not.toHaveBeenCalled();
    });

    describe('popup closed', () => {
      let popup: Window;
      let popupResult: PopupResult;
      let cleanUpSpy: Mock<any>;

      beforeEach(() => {
        popup = {
          closed: false,
          close: () => undefined,
        } as Window;

        vi.spyOn(window, 'open').mockReturnValue(popup);

        cleanUpSpy = vi.spyOn(popUpService as any, 'cleanUp');

        popupResult = {} as PopupResult;

        popUpService.result$.subscribe((result) => (popupResult = result));
      });

      it('should handle a received message with data', async () => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        vi.spyOn(window, 'addEventListener').mockImplementation(
          (_: any, func: any) => (listener = func)
        );

        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: false,
          receivedUrl: 'some-url1111',
        });
        expect(cleanUpSpy).toHaveBeenCalledTimes(1);
        expect(cleanUpSpy).toHaveBeenCalledWith(listener, {
          configId: 'configId1',
        });
      });

      it('should clean up without firing an event when a message without data is received', async () => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        vi.spyOn(window, 'addEventListener').mockImplementation(
          (_: any, func: any) => (listener = func)
        );
        const nextSpy = vi
          .spyOn((popUpService as any).resultInternal$, 'next')
          .mockReturnValue(undefined);

        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: null }));

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
      });

      it('should not clean up when a message without data is received and disableCleaningPopupOnInvalidMessage is true', async () => {
        // arrange
        let listener: (event: MessageEvent) => void = () => {
          return;
        };

        vi.spyOn(window, 'addEventListener').mockImplementation(
          (_: any, func: any) => (listener = func)
        );
        const nextSpy = vi
          .spyOn((popUpService as any).resultInternal$, 'next')
          .mockReturnValue(undefined);

        // act
        popUpService.openPopUp(
          'url',
          {},
          {
            configId: 'configId1',
            disableCleaningPopupOnInvalidMessage: true,
          }
        );

        listener(new MessageEvent('message', { data: null }));

        // assert
        expect(cleanUpSpy).not.toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();

        // cleanup the interval started by openPopUp
        (popup as any).closed = true;
        await vi.advanceTimersByTimeAsync(200);
      });

      it('should emit when the user closes the popup', async () => {
        // arrange & act
        popUpService.openPopUp('url', undefined, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(cleanUpSpy).not.toHaveBeenCalled();

        (popup as any).closed = true;

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: true,
          receivedUrl: '',
        } as PopupResult);
        expect(cleanUpSpy).toHaveBeenCalled();
      });
    });
  });

  describe('sendMessageToMainWindow', () => {
    it('should do nothing if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );
      const sendMessageSpy = vi
        .spyOn(popUpService as any, 'sendMessage')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('someUrl', {
        configId: 'configId1',
      });

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if window.opener is null', () => {
      // arrange
      vi.stubGlobal('opener', null);

      const sendMessageSpy = vi
        .spyOn(popUpService as any, 'sendMessage')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('', {});

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should call postMessage when window opener is given', () => {
      // arrange
      vi.stubGlobal('opener', {
        postMessage: () => undefined,
      });
      const sendMessageSpy = vi
        .spyOn(window.opener, 'postMessage')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('someUrl', {});

      // assert
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(sendMessageSpy).toHaveBeenCalledWith(
        'someUrl',
        expect.any(String)
      );
    });

    it('should not postMessage and log debug when url is empty', () => {
      // arrange
      vi.stubGlobal('opener', {
        postMessage: () => undefined,
      });
      const sendMessageSpy = vi
        .spyOn(window.opener, 'postMessage')
        .mockReturnValue(undefined);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('', { configId: 'configId1' });

      // assert
      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('cleanUp', () => {
    it('should do nothing if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );
      const removeSpy = vi
        .spyOn(window, 'removeEventListener')
        .mockReturnValue(undefined);
      const removeItemSpy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);

      // act
      (popUpService as any).cleanUp(null, { configId: 'configId1' });

      // assert
      expect(removeSpy).not.toHaveBeenCalled();
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('should call removeEventListener on window with correct params', () => {
      // arrange
      const spy = vi
        .spyOn(window, 'removeEventListener')
        .mockImplementation(() => undefined);
      const listener: any = null;

      // act
      (popUpService as any).cleanUp(listener, { configId: 'configId1' });

      // assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('message', listener, false);
    });

    it('should remove popup from sessionstorage, closes and nulls when popup is opened', () => {
      // arrange
      const popupMock = {
        anyThing: 'truthy',
        sessionStorage: mockStorage,
        close: (): void => undefined,
      };
      const removeItemSpy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);
      const closeSpy = vi.spyOn(popupMock, 'close').mockReturnValue(undefined);

      // act
      (popUpService as any).popUp = popupMock;
      (popUpService as any).cleanUp(null, { configId: 'configId1' });

      // assert
      expect(removeItemSpy).toHaveBeenCalledTimes(1);

      // assert
      expect(removeItemSpy).toHaveBeenCalledWith('popupauth', {
        configId: 'configId1',
      });
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect((popUpService as any).popUp).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should do nothing if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      // act
      const result = (popUpService as any).sendMessage('url', 'href', {
        configId: 'configId1',
      });

      // assert
      expect(result).toBeUndefined();
      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('getOptions', () => {
    it('should return an empty string if there is no window available', () => {
      // arrange
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue(
        null
      );

      // act
      const result = (popUpService as any).getOptions({});

      // assert
      expect(result).toBe('');
    });

    it('should fall back to default width and height when passed values are falsy', () => {
      // arrange
      const popupOptions = { width: 0, height: 0 };
      // act
      const result = (popUpService as any).getOptions(popupOptions);
      // assert
      // the default width/height (500) is used to center the popup
      const expectedLeft = window.screenLeft + (window.outerWidth - 500) / 2;
      const expectedTop = window.screenTop + (window.outerHeight - 500) / 2;

      expect(result).toContain(`left=${expectedLeft}`);
      expect(result).toContain(`top=${expectedTop}`);
      expect(result).toContain('width=500');
      expect(result).toContain('height=500');
      expect(result).not.toContain('width=0');
    });

    it('should return a comma separated, url-encoded options string', () => {
      // arrange
      const popupOptions = { width: 100, height: 200 };
      // act
      const result = (popUpService as any).getOptions(popupOptions);

      // assert
      expect(result).toContain('width=100');
      expect(result).toContain('height=200');
      expect(result.split(',').length).toBe(4);
    });
  });

  describe('canAccessSessionStorage', () => {
    it('should return a boolean based on navigator, cookies and Storage availability', () => {
      // act
      const result = (popUpService as any).canAccessSessionStorage();

      // assert
      expect(typeof result).toBe('boolean');
    });
  });
});
