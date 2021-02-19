import { TestBed, waitForAsync } from '@angular/core/testing';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../../config/config.provider';
import { ConfigurationProviderMock } from '../../config/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../../storage/storage-persistance.service-mock';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { SigninKeyDataService } from '../signin-key-data.service';
import { SigninKeyDataServiceMock } from '../signin-key-data.service-mock';
import { HistoryJwtKeysCallbackHandlerService } from './history-jwt-keys-callback-handler.service';

describe('HistoryJwtKeysCallbackHandlerService', () => {
  let service: HistoryJwtKeysCallbackHandlerService;
  let storagePersistanceService: StoragePersistanceService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoryJwtKeysCallbackHandlerService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: SigninKeyDataService, useClass: SigninKeyDataServiceMock },
        { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(HistoryJwtKeysCallbackHandlerService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackHistoryAndResetJwtKeys', () => {
    it(
      'writes authResult into the storage',
      waitForAsync(() => {
        const spy = spyOn(storagePersistanceService, 'write');

        const callbackContext = ({ authResult: 'authResult' } as unknown) as CallbackContext;

        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ historyCleanupOff: true });

        (service as any).callbackHistoryAndResetJwtKeys(callbackContext).subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('authResult');
        });
      })
    );
  });

  describe('historyCleanUpTurnedOn ', () => {
    it('check for false if historyCleanUpTurnedOn is on', () => {
      spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({
        historyCleanupOff: true,
      });

      const value = (service as any).historyCleanUpTurnedOn();
      expect(value).toEqual(false);
    });

    it('check for true if historyCleanUpTurnedOn is off', () => {
      spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({
        historyCleanupOff: false,
      });

      const value = (service as any).historyCleanUpTurnedOn();
      expect(value).toEqual(true);
    });
  });
});
