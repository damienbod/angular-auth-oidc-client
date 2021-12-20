import { AuthOptions } from '../../auth-options';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { PopupOptions } from '../popup/popup-options';

export class ParLoginServiceMock {
  loginPar(configuration: OpenIdConfiguration, authOptions?: AuthOptions) {}

  loginWithPopUpPar(
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions
  ) {}
}
