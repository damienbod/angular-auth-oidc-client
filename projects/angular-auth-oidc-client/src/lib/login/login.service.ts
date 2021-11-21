import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthOptions } from '../auth-options';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { LoginResponse } from './login-response';
import { ParLoginService } from './par/par-login.service';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopupOptions } from './popup/popup-options';
import { StandardLoginService } from './standard/standard-login.service';

@Injectable()
export class LoginService {
  constructor(
    private parLoginService: ParLoginService,
    private popUpLoginService: PopUpLoginService,
    private standardLoginService: StandardLoginService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  login(configuration: OpenIdConfiguration, authOptions?: AuthOptions): void {
    const { usePushedAuthorisationRequests, configId } = configuration;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomParamsAuthRequest', authOptions.customParams, configId);
    }

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginPar(configId, authOptions);
    } else {
      return this.standardLoginService.loginStandard(configId, authOptions);
    }
  }

  loginWithPopUp(configuration: OpenIdConfiguration, authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
    const { usePushedAuthorisationRequests, configId } = configuration;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomParamsAuthRequest', authOptions.customParams, configId);
    }

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginWithPopUpPar(configId, authOptions, popupOptions);
    } else {
      return this.popUpLoginService.loginWithPopUpStandard(configId, authOptions, popupOptions);
    }
  }
}
