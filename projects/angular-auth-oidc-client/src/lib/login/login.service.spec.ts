import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { LoginService } from './login.service';
import { ParLoginService } from './par/par-login.service';
import { ParLoginServiceMock } from './par/par-login.service-mock';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopUpLoginServiceMock } from './popup/popup-login.service-mock';
import { StandardLoginService } from './standard/standard-login.service';
import { StandardLoginServiceMock } from './standard/standard-login.service-mock';

describe('LoginService', () => {
  let service: LoginService;
  let configurationProvider: ConfigurationProvider;
  let parLoginService: ParLoginService;
  let popUpLoginService: PopUpLoginService;
  let standardLoginService: StandardLoginService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        LoginService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: ParLoginService, useClass: ParLoginServiceMock },
        { provide: PopUpLoginService, useClass: PopUpLoginServiceMock },
        { provide: StandardLoginService, useClass: StandardLoginServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LoginService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    parLoginService = TestBed.inject(ParLoginService);
    popUpLoginService = TestBed.inject(PopUpLoginService);
    standardLoginService = TestBed.inject(StandardLoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('calls parLoginService loginPar if usePushedAuthorisationRequests is true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: true });
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const standardLoginSpy = spyOn(standardLoginService, 'loginStandard');

      service.login('configId');

      expect(loginParSpy).toHaveBeenCalledTimes(1);
      expect(standardLoginSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginStandard if usePushedAuthorisationRequests is false', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: false });
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const standardLoginSpy = spyOn(standardLoginService, 'loginStandard');

      service.login('configId');

      expect(loginParSpy).not.toHaveBeenCalled();
      expect(standardLoginSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: false });
      const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
      const authOptions = { customParams: { custom: 'params' } };

      service.login('configId', authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('storageCustomParamsAuthRequest', { custom: 'params' }, 'configId');
    });
  });

  describe('loginWithPopUp', () => {
    it('calls parLoginService loginWithPopUpPar if usePushedAuthorisationRequests is true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: true });
      const loginParSpy = spyOn(parLoginService, 'loginWithPopUpPar');
      const loginWithPopUpStandardSpy = spyOn(popUpLoginService, 'loginWithPopUpStandard');

      service.loginWithPopUp('configId');

      expect(loginParSpy).toHaveBeenCalledTimes(1);
      expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginstandard if usePushedAuthorisationRequests is false', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: false });
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const loginWithPopUpStandardSpy = spyOn(popUpLoginService, 'loginWithPopUpStandard');

      service.loginWithPopUp('configId');

      expect(loginParSpy).not.toHaveBeenCalled();
      expect(loginWithPopUpStandardSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ usePushedAuthorisationRequests: false });
      const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
      const authOptions = { customParams: { custom: 'params' } };

      service.loginWithPopUp('configId', authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('storageCustomParamsAuthRequest', { custom: 'params' }, 'configId');
    });
  });
});
