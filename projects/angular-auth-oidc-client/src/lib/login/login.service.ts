import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthOptions } from '../auth-options';
import { ConfigurationProvider } from '../config/config.provider';
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
    private standardLoginService: StandardLoginService
  ) {}

  login(configId: string, authOptions?: AuthOptions): void {
    const { usePushedAuthorisationRequests } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginPar(authOptions);
    } else {
      return this.standardLoginService.loginStandard(authOptions);
    }
  }

  loginWithPopUp(configId: string, authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
    const { usePushedAuthorisationRequests } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginWithPopUpPar(authOptions, popupOptions);
    } else {
      return this.popUpLoginService.loginWithPopUpStandard(authOptions, popupOptions);
    }
  }
}
