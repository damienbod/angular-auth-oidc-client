import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT } from '@angular/core';
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
  // The service reads `document.defaultView` on every call, so tests can swap
  // the window (or remove it) by changing this mocked DOCUMENT.
  let documentMock: { defaultView: Window | null };

  beforeEach(() => {
    documentMock = { defaultView: window };

    TestBed.configureTestingModule({
      providers: [
        mockProvider(StoragePersistenceService),
        mockProvider(LoggerService),
        { provide: DOCUMENT, useValue: documentMock },
      ],
    });
  });

  beforeEach(() => {
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    loggerService = TestBed.inject(LoggerService);
    popUpService = TestBed.inject(PopUpService);
  });

  it('should create', () => {
    expect(popUpService).toBeTruthy();
  });

  describe('isCurrentlyInPopup', () => {
    it('should return false if can not access Session Storage', () => {
      // arrange
      vi.stubGlobal('Storage', undefined);
      documentMock.defaultView = { opener: {} as Window } as Window;
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        popupauth: true,
      });
      const config = {} as OpenIdConfiguration;
      // act
      const result = popUpService.isCurrentlyInPopup(config);

      // assert
      expect(result).toBe(false);
    });

    it('should return false if cookies are disabled', () => {
      // arrange
      vi.stubGlobal('navigator', { cookieEnabled: false });
      documentMock.defaultView = { opener: {} as Window } as Window;
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
      documentMock.defaultView = { opener: null } as Window;
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
      documentMock.defaultView = null;
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
      documentMock.defaultView = { opener: {} as Window } as Window;
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
      documentMock.defaultView = windowMock;
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
      documentMock.defaultView = { opener: {} as Window } as Window;
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
        expect.stringContaining('width=500')
      );
      expect(popupSpy).toHaveBeenCalledWith(
        'url',
        '_blank',
        expect.stringContaining('height=500')
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

    it('should fall back to default width and height when passed values are falsy', () => {
      // arrange
      const popupSpy = vi.spyOn(window, 'open').mockImplementation(
        () =>
          ({
            closed: true,
            close: () => undefined,
          }) as Window
      );

      // act
      popUpService.openPopUp(
        'url',
        { width: 0, height: 0 },
        { configId: 'configId1' }
      );

      // assert
      // the default width/height (500) is used to center the popup
      const options = popupSpy.mock.calls[0][2] as string;
      const expectedLeft = window.screenLeft + (window.outerWidth - 500) / 2;
      const expectedTop = window.screenTop + (window.outerHeight - 500) / 2;

      expect(options).toContain(`left=${expectedLeft}`);
      expect(options).toContain(`top=${expectedTop}`);
      expect(options).toContain('width=500');
      expect(options).toContain('height=500');
      expect(options).not.toContain('width=0');
    });

    it('should pass a comma separated, url-encoded options string', () => {
      // arrange
      const popupSpy = vi.spyOn(window, 'open').mockImplementation(
        () =>
          ({
            closed: true,
            close: () => undefined,
          }) as Window
      );

      // act
      popUpService.openPopUp(
        'url',
        { width: 100, height: 200 },
        { configId: 'configId1' }
      );

      // assert
      const options = popupSpy.mock.calls[0][2] as string;

      expect(options).toContain('width=100');
      expect(options).toContain('height=200');
      expect(options.split(',').length).toBe(4);
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
      documentMock.defaultView = null;
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
      let emittedResults: PopupResult[];
      let listener: (event: MessageEvent) => void;
      let removeEventListenerSpy: any;
      let removeItemSpy: any;
      let closeSpy: any;

      beforeEach(() => {
        popup = {
          closed: false,
          close: () => undefined,
        } as Window;

        vi.spyOn(window, 'open').mockReturnValue(popup);

        listener = (): void => {
          return;
        };
        vi.spyOn(window, 'addEventListener').mockImplementation(
          (_: any, func: any) => (listener = func)
        );
        removeEventListenerSpy = vi
          .spyOn(window, 'removeEventListener')
          .mockImplementation(() => undefined);
        removeItemSpy = vi
          .spyOn(storagePersistenceService, 'remove')
          .mockReturnValue(undefined);
        closeSpy = vi.spyOn(popup, 'close');

        popupResult = {} as PopupResult;
        emittedResults = [];

        popUpService.result$.subscribe((result) => {
          popupResult = result;
          emittedResults.push(result);
        });
      });

      it('should handle a received message with data', async () => {
        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(removeItemSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: false,
          receivedUrl: 'some-url1111',
        });
        expect(emittedResults.length).toBe(1);
      });

      it('should remove the message listener, the storage flag and close the popup after a received message', async () => {
        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        listener(new MessageEvent('message', { data: 'some-url1111' }));

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'message',
          listener,
          false
        );
        expect(removeItemSpy).toHaveBeenCalledTimes(1);
        expect(removeItemSpy).toHaveBeenCalledWith('popupauth', {
          configId: 'configId1',
        });
        expect(closeSpy).toHaveBeenCalledTimes(1);
      });

      it('should not clean up if the window is gone when a message is received', async () => {
        // arrange
        popUpService.openPopUp('url', {}, { configId: 'configId1' });
        documentMock.defaultView = null;

        // act
        listener(new MessageEvent('message', { data: 'some-url1111' }));

        // assert
        expect(removeEventListenerSpy).not.toHaveBeenCalled();
        expect(removeItemSpy).not.toHaveBeenCalled();
        expect(closeSpy).not.toHaveBeenCalled();

        // cleanup the interval started by openPopUp
        documentMock.defaultView = window;
        (popup as any).closed = true;
        await vi.advanceTimersByTimeAsync(200);
      });

      it('should clean up without firing an event when a message without data is received', async () => {
        // act
        popUpService.openPopUp('url', {}, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(removeItemSpy).not.toHaveBeenCalled();

        listener(new MessageEvent('message', { data: null }));

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({} as PopupResult);
        expect(emittedResults.length).toBe(0);
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'message',
          listener,
          false
        );
        expect(removeItemSpy).toHaveBeenCalledWith('popupauth', {
          configId: 'configId1',
        });
        expect(closeSpy).toHaveBeenCalledTimes(1);
      });

      it('should not clean up when a message without data is received and disableCleaningPopupOnInvalidMessage is true', async () => {
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
        expect(removeEventListenerSpy).not.toHaveBeenCalled();
        expect(removeItemSpy).not.toHaveBeenCalled();
        expect(closeSpy).not.toHaveBeenCalled();
        expect(emittedResults.length).toBe(0);

        // cleanup the interval started by openPopUp
        (popup as any).closed = true;
        await vi.advanceTimersByTimeAsync(200);
      });

      it('should emit when the user closes the popup', async () => {
        // arrange & act
        popUpService.openPopUp('url', undefined, { configId: 'configId1' });

        expect(popupResult).toEqual({} as PopupResult);
        expect(removeItemSpy).not.toHaveBeenCalled();

        (popup as any).closed = true;

        await vi.advanceTimersByTimeAsync(200);

        // assert
        expect(popupResult).toEqual({
          userClosed: true,
          receivedUrl: '',
        } as PopupResult);
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'message',
          listener,
          false
        );
        expect(removeItemSpy).toHaveBeenCalledWith('popupauth', {
          configId: 'configId1',
        });
      });

      it('should stop polling the popup after it has been cleaned up', async () => {
        // arrange
        popUpService.openPopUp('url', undefined, { configId: 'configId1' });
        (popup as any).closed = true;
        await vi.advanceTimersByTimeAsync(200);

        // act
        await vi.advanceTimersByTimeAsync(1000);

        // assert
        expect(emittedResults.length).toBe(1);
      });
    });
  });

  describe('sendMessageToMainWindow', () => {
    it('should do nothing if there is no window available', () => {
      // arrange
      documentMock.defaultView = null;
      vi.stubGlobal('opener', {
        postMessage: () => undefined,
      });
      const postMessageSpy = vi
        .spyOn(window.opener, 'postMessage')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('someUrl', {
        configId: 'configId1',
      });

      // assert
      expect(postMessageSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if window.opener is null', () => {
      // arrange
      vi.stubGlobal('opener', null);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);

      // act
      popUpService.sendMessageToMainWindow('', {});

      // assert
      expect(loggerSpy).not.toHaveBeenCalled();
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
});
