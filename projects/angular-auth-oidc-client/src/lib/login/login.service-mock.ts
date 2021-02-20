import { Injectable } from '@angular/core';
import { AuthOptions } from './auth-options';
import { PopupOptions } from './popup-options';

@Injectable()
export class LoginServiceMock {
  login(authOptions?: AuthOptions) {}

  loginWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions) {}
}
