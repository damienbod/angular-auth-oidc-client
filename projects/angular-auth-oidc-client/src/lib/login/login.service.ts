import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthOptions } from '../auth-options';
import { ConfigurationProvider } from '../config/config.provider';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { LoginResponse } from './login-response';
import { ParLoginService } from './par/par-login.service';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopupOptions } from './popup/popup-options';
import { StandardLoginService } from './standard/standard-login.service';

@Injectable()
export class LoginService {
  constructor(
    private configurationProvider: ConfigurationProvider,
    private parLoginService: ParLoginService,
    private popUpLoginService: PopUpLoginService,
    private standardLoginService: StandardLoginService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  login(configId: string, authOptions?: AuthOptions): void {
    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams, configId);
    }

    const { usePushedAuthorisationRequests } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginPar(configId, authOptions);
    } else {
      return this.standardLoginService.loginStandard(configId, authOptions);
    }
  }

  loginWithPopUp(configId: string, authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse | LoginResponse[]> {
    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams, configId);
    }

    const { usePushedAuthorisationRequests } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginWithPopUpPar(configId, authOptions, popupOptions);
    } else {
      return this.popUpLoginService.loginWithPopUpStandard(configId, authOptions, popupOptions);
    }
  }
}
