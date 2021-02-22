import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoginService } from './login.service';
import { ParLoginService } from './par/par-login.service';
import { ParLoginServiceMock } from './par/par-login.service-mock';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopUpLoginServiceMock } from './popup/popup-login.service-mock';
import { StandardLoginService } from './standard/standard-login.service';
import { StandardLoginServiceMock } from './standard/standard-login.service-mock';

describe('LoginService', () => {
  let loginService: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        LoginService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: ParLoginService, useClass: ParLoginServiceMock },
        { provide: PopUpLoginService, useClass: PopUpLoginServiceMock },
        { provide: StandardLoginService, useClass: StandardLoginServiceMock },
      ],
    });
  });

  beforeEach(() => {
    loginService = TestBed.inject(LoginService);
  });

  it('should create', () => {
    expect(loginService).toBeTruthy();
  });
});
