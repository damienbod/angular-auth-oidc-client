import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StateValidationService } from '../../validation/state-validation.service';
import { StateValidationServiceMock } from '../../validation/state-validation.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { StateValidationCallbackHandlerService } from './state-validation-callback-handler.service';

describe('StateValidationCallbackHandlerService', () => {
  let service: StateValidationCallbackHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StateValidationCallbackHandlerService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: StateValidationService, useClass: StateValidationServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(StateValidationCallbackHandlerService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
