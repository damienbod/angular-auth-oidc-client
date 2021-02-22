import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { AuthOptions } from './auth-options';
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

  login(authOptions?: AuthOptions) {
    const usePushedAuthorisationRequests = this.configurationProvider.openIDConfiguration.usePushedAuthorisationRequests;

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginPar(authOptions);
    } else {
      return this.standardLoginService.loginStandard(authOptions);
    }
  }

  loginWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions) {
    const usePushedAuthorisationRequests = this.configurationProvider.openIDConfiguration.usePushedAuthorisationRequests;

    if (usePushedAuthorisationRequests) {
      return this.parLoginService.loginWithPopUpPar(authOptions, popupOptions);
    } else {
      return this.popUpLoginService.loginWithPopUpStandard(authOptions, popupOptions);
    }
  }
}
