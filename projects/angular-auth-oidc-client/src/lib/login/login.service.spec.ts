import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
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
      const loginParSpy = vi
        .spyOn(parLoginService, 'loginPar')
        .mockReturnValue(undefined);
      const standardLoginSpy = vi
        .spyOn(standardLoginService, 'loginStandard')
        .mockReturnValue(undefined);

      service.login(config);

      expect(loginParSpy).toHaveBeenCalledTimes(1);
      expect(standardLoginSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginStandard if usePushedAuthorisationRequests is false', () => {
      const config = { usePushedAuthorisationRequests: false };
      const loginParSpy = vi
        .spyOn(parLoginService, 'loginPar')
        .mockReturnValue(undefined);
      const standardLoginSpy = vi
        .spyOn(standardLoginService, 'loginStandard')
        .mockReturnValue(undefined);

      service.login(config);

      expect(loginParSpy).not.toHaveBeenCalled();
      expect(standardLoginSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', () => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const authOptions = { customParams: { custom: 'params' } };

      service.login(config, authOptions);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(1);

      expect(storagePersistenceServiceSpy).toHaveBeenCalledWith(
        'storageCustomParamsAuthRequest',
        { custom: 'params' },
        config
      );
    });

    it("should throw error if configuration is null and doesn't call loginPar or loginStandard", () => {
      // arrange
      const config = null;
      const loginParSpy = vi
        .spyOn(parLoginService, 'loginPar')
        .mockReturnValue(undefined);
      const standardLoginSpy = vi
        .spyOn(standardLoginService, 'loginStandard')
        .mockReturnValue(undefined);
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
    it('calls parLoginService loginWithPopUpPar if usePushedAuthorisationRequests is true', async () => {
      // arrange
      const config = { usePushedAuthorisationRequests: true };
      const loginWithPopUpPar = vi
        .spyOn(parLoginService, 'loginWithPopUpPar')
        .mockReturnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = vi
        .spyOn(popUpLoginService, 'loginWithPopUpStandard')
        .mockReturnValue(of({} as LoginResponse));

      // act
      await firstValueFrom(service.loginWithPopUp(config, [config]));

      // assert
      expect(loginWithPopUpPar).toHaveBeenCalledTimes(1);
      expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
    });

    it('calls standardLoginService loginstandard if usePushedAuthorisationRequests is false', async () => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const loginWithPopUpPar = vi
        .spyOn(parLoginService, 'loginWithPopUpPar')
        .mockReturnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = vi
        .spyOn(popUpLoginService, 'loginWithPopUpStandard')
        .mockReturnValue(of({} as LoginResponse));

      // act
      await firstValueFrom(service.loginWithPopUp(config, [config]));

      // assert
      expect(loginWithPopUpPar).not.toHaveBeenCalled();
      expect(loginWithPopUpStandardSpy).toHaveBeenCalledTimes(1);
    });

    it('stores the customParams to the storage if customParams are given', async () => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const storagePersistenceServiceSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const authOptions = { customParams: { custom: 'params' } };

      vi.spyOn(popUpLoginService, 'loginWithPopUpStandard').mockReturnValue(
        of({} as LoginResponse)
      );

      // act
      await firstValueFrom(
        service.loginWithPopUp(config, [config], authOptions)
      );

      // assert
      expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(1);
      // assert
      expect(storagePersistenceServiceSpy).toHaveBeenCalledWith(
        'storageCustomParamsAuthRequest',
        { custom: 'params' },
        config
      );
    });

    it('throws error if configuration is null', () => {
      // arrange
      const config = null;
      const loginWithPopUpParSpy = vi
        .spyOn(parLoginService, 'loginWithPopUpPar')
        .mockReturnValue(undefined as any);
      const loginWithPopUpStandardSpy = vi
        .spyOn(popUpLoginService, 'loginWithPopUpStandard')
        .mockReturnValue(undefined as any);
      // act
      const fn = (): void => {
        service.loginWithPopUp(config, []);
      };

      // assert
      expect(fn).toThrow(
        new Error('Please provide a configuration before setting up the module')
      );
      expect(loginWithPopUpParSpy).not.toHaveBeenCalled();
      expect(loginWithPopUpStandardSpy).not.toHaveBeenCalled();
    });

    it('returns error if there is already a popup open', () => {
      // arrange
      const config = { usePushedAuthorisationRequests: false };
      const authOptions = { customParams: { custom: 'params' } };
      const loginWithPopUpPar = vi
        .spyOn(parLoginService, 'loginWithPopUpPar')
        .mockReturnValue(of({} as LoginResponse));
      const loginWithPopUpStandardSpy = vi
        .spyOn(popUpLoginService, 'loginWithPopUpStandard')
        .mockReturnValue(of({} as LoginResponse));

      vi.spyOn(popUpService, 'isCurrentlyInPopup').mockReturnValue(true);

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
