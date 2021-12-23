import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../test/auto-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { LoginService } from './login.service';
import { ParLoginService } from './par/par-login.service';
import { PopUpLoginService } from './popup/popup-login.service';
import { StandardLoginService } from './standard/standard-login.service';

describe('LoginService', () => {
  let service: LoginService;
  let parLoginService: ParLoginService;
  let popUpLoginService: PopUpLoginService;
  let standardLoginService: StandardLoginService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        LoginService,
        { provide: ParLoginService, useClass: mockClass(ParLoginService) },
        { provide: PopUpLoginService, useClass: mockClass(PopUpLoginService) },
        { provide: StandardLoginService, useClass: mockClass(StandardLoginService) },
        { provide: StoragePersistenceService, useClass: mockClass(StoragePersistenceService) },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LoginService);
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
      const config = { usePushedAuthorisationRequests: true };
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const standardLoginSpy = spyOn(standardLoginService, 'loginStandard');

      service.login(config);

      expect(loginParSpy).toHaveBeenCalledTimes(1);
      expect(standardLoginSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginStandard if usePushedAuthorisationRequests is false', () => {
      const config = { usePushedAuthorisationRequests: false };
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const standardLoginSpy = spyOn(standardLoginService, 'loginStandard');

      service.login(config);

      expect(loginParSpy).not.toHaveBeenCalled();
      expect(standardLoginSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', () => {
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
      const authOptions = { customParams: { custom: 'params' } };

      service.login(config, authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('storageCustomParamsAuthRequest', { custom: 'params' }, config);
    });
  });

  describe('loginWithPopUp', () => {
    it('calls parLoginService loginWithPopUpPar if usePushedAuthorisationRequests is true', () => {
      const config = { usePushedAuthorisationRequests: true };
      const loginParSpy = spyOn(parLoginService, 'loginWithPopUpPar');
      const loginWithPopUpStandardSpy = spyOn(popUpLoginService, 'loginWithPopUpStandard');

      service.loginWithPopUp(config, [config]);

      expect(loginParSpy).toHaveBeenCalledTimes(1);
      expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginstandard if usePushedAuthorisationRequests is false', () => {
      const config = { usePushedAuthorisationRequests: false };
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const loginWithPopUpStandardSpy = spyOn(popUpLoginService, 'loginWithPopUpStandard');

      service.loginWithPopUp(config, [config]);

      expect(loginParSpy).not.toHaveBeenCalled();
      expect(loginWithPopUpStandardSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', () => {
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
      const authOptions = { customParams: { custom: 'params' } };

      service.loginWithPopUp(config, [config], authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('storageCustomParamsAuthRequest', { custom: 'params' }, config);
    });
  });
});
