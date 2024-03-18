import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { LoginResponse } from './login-response';
import { LoginService } from './login.service';
import { ParLoginService } from './par/par-login.service';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopUpService } from './popup/popup.service';
import { StandardLoginService } from './standard/standard-login.service';

describe('LoginService', () => {
  let service: LoginService;
  let parLoginService: ParLoginService;
  let popUpLoginService: PopUpLoginService;
  let standardLoginService: StandardLoginService;
  let storagePersistenceService: StoragePersistenceService;
  let popUpService: PopUpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        LoginService,
        mockProvider(ParLoginService),
        mockProvider(PopUpLoginService),
        mockProvider(StandardLoginService),
        mockProvider(StoragePersistenceService),
        mockProvider(PopUpService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LoginService);
    parLoginService = TestBed.inject(ParLoginService);
    popUpLoginService = TestBed.inject(PopUpLoginService);
    standardLoginService = TestBed.inject(StandardLoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    popUpService = TestBed.inject(PopUpService);
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
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );
      const authOptions = { customParams: { custom: 'params' } };

      service.login(config, authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith(
        'storageCustomParamsAuthRequest',
        { custom: 'params' },
        config
      );
    });

    it("should throw error if configuration is null and doesn't call loginPar or loginStandard", () => {
      // arrange
      const config = null;
      const loginParSpy = spyOn(parLoginService, 'loginPar');
      const standardLoginSpy = spyOn(standardLoginService, 'loginStandard');
      const authOptions = { customParams: { custom: 'params' } };

      // act
      const fn = (): void => service.login(config, authOptions);

      // assert
      expect(fn).toThrow(
        new Error('Please provide a configuration before setting up the module')
      );
      expect(loginParSpy).not.toHaveBeenCalled();
      expect(standardLoginSpy).not.toHaveBeenCalled();
    });
  });

  describe('loginWithPopUp', () => {
    it('calls parLoginService loginWithPopUpPar if usePushedAuthorisationRequests is true', waitForAsync(() => {
      // arrange
      const config = { usePushedAuthorisationRequests: true };
      const loginWithPopUpPar = spyOn(
        parLoginService,
        'loginWithPopUpPar'
      ).and.returnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = spyOn(
        popUpLoginService,
        'loginWithPopUpStandard'
      ).and.returnValue(of({} as LoginResponse));

      // act
      service.loginWithPopUp(config, [config]).subscribe(() => {
        // assert
        expect(loginWithPopUpPar).toHaveBeenCalledTimes(1);
        expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
      });
    }));

    it('calls standardLoginService loginstandard if usePushedAuthorisationRequests is false', waitForAsync(() => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const loginWithPopUpPar = spyOn(
        parLoginService,
        'loginWithPopUpPar'
      ).and.returnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = spyOn(
        popUpLoginService,
        'loginWithPopUpStandard'
      ).and.returnValue(of({} as LoginResponse));

      // act
      service.loginWithPopUp(config, [config]).subscribe(() => {
        // assert
        expect(loginWithPopUpPar).not.toHaveBeenCalled();
        expect(loginWithPopUpStandardSpy).toHaveBeenCalledTimes(1);
      });
    }));

    it('stores the customParams to the storage if customParams are given', waitForAsync(() => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );
      const authOptions = { customParams: { custom: 'params' } };

      spyOn(popUpLoginService, 'loginWithPopUpStandard').and.returnValue(
        of({} as LoginResponse)
      );

      // act
      service.loginWithPopUp(config, [config], authOptions).subscribe(() => {
        // assert
        expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith(
          'storageCustomParamsAuthRequest',
          { custom: 'params' },
          config
        );
      });
    }));

    it('returns error if there is already a popup open', () => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const authOptions = { customParams: { custom: 'params' } };
      const loginWithPopUpPar = spyOn(
        parLoginService,
        'loginWithPopUpPar'
      ).and.returnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = spyOn(
        popUpLoginService,
        'loginWithPopUpStandard'
      ).and.returnValue(of({} as LoginResponse));

      spyOn(popUpService, 'isCurrentlyInPopup').and.returnValue(true);

      // act
      service
        .loginWithPopUp(config, [config], authOptions)
        .subscribe((result) => {
          // assert
          expect(result).toEqual({
            errorMessage: 'There is already a popup open.',
          } as LoginResponse);
          expect(loginWithPopUpPar).not.toHaveBeenCalled();
          expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
        });
    });
  });
});
