import { Injectable } from '@angular/core';
import { AuthOptions } from '../../auth-options';
import { PopupOptions } from '../popup/popup-options';

@Injectable()
export class ParLoginServiceMock {
  loginPar(authOptions?: AuthOptions) {}

  loginWithPopUpPar(authOptions?: AuthOptions, popupOptions?: PopupOptions) {}
}
