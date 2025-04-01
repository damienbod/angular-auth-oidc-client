import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthOptions } from '../auth-options';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { LoginResponse } from './login-response';
import { ParLoginService } from './par/par-login.service';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopupOptions } from './popup/popup-options';
import { PopUpService } from './popup/popup.service';
import { StandardLoginService } from './standard/standard-login.service';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly parLoginService = inject(ParLoginService);
  private readonly popUpLoginService = inject(PopUpLoginService);
  private readonly standardLoginService = inject(StandardLoginService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly popupService = inject(PopUpService);

  login(
    configuration: OpenIdConfiguration | null,
    authOptions?: AuthOptions
  ): void {
    if (!configuration) {
      throw new Error(
        'Please provide a configuration before setting up the module'
      );
    }

    const { usePushedAuthorisationRequests } = configuration;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write(
        'storageCustomParamsAuthRequest',
        authOptions.customParams,
        configuration
      );
    }

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginPar(configuration, authOptions);
    } else {
      return this.standardLoginService.loginStandard(
        configuration,
        authOptions
      );
    }
  }

  loginWithPopUp(
    configuration: OpenIdConfiguration | null,
    allConfigs: OpenIdConfiguration[],
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions
  ): Observable<LoginResponse> {
    if (!configuration) {
      throw new Error(
        'Please provide a configuration before setting up the module'
      );
    }

    const isAlreadyInPopUp =
      this.popupService.isCurrentlyInPopup(configuration);

    if (isAlreadyInPopUp) {
      return of({
        errorMessage: 'There is already a popup open.',
      } as LoginResponse);
    }

    const { usePushedAuthorisationRequests } = configuration;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write(
        'storageCustomParamsAuthRequest',
        authOptions.customParams,
        configuration
      );
    }

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginWithPopUpPar(
        configuration,
        allConfigs,
        authOptions,
        popupOptions
      );
    }

    return this.popUpLoginService.loginWithPopUpStandard(
      configuration,
      allConfigs,
      authOptions,
      popupOptions
    );
  }
}
