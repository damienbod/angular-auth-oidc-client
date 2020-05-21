import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { EventTypes, PublicEventsService } from '../../public-api';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { AuthStateService } from './auth-state.service';

describe('Auth State Service', () => {
    let authStateService: AuthStateService;
    let storagePersistanceService: StoragePersistanceService;
    let eventsService: PublicEventsService;
    let tokenValidationService: TokenValidationService;
    let configurationProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ConfigurationProvider,
                AuthStateService,
                PublicEventsService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: TokenValidationService, useClass: TokenValidationServiceMock },
                { provide: PlatformProvider, useClass: PlatformProviderMock },
                {
                    provide: StoragePersistanceService,
                    useClass: StoragePersistanceServiceMock,
                },
            ],
        });
    });

    beforeEach(() => {
        authStateService = TestBed.inject(AuthStateService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        eventsService = TestBed.inject(PublicEventsService);
        tokenValidationService = TestBed.inject(TokenValidationService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
    });

    it('should create', () => {
        expect(authStateService).toBeTruthy();
    });

    it('public authorize$ is observable$', () => {
        expect(authStateService.authorized$).toEqual(jasmine.any(Observable));
    });

    describe('setAuthorizedAndFireEvent', () => {
        it('throws event when state is being set to `true`', () => {
            const spy = spyOn((authStateService as any).authorizedInternal$, 'next');
            authStateService.setAuthorizedAndFireEvent();
            expect(spy).toHaveBeenCalledWith(true);
        });
    });

    describe('setUnauthorizedAndFireEvent', () => {
        it('persist AuthState In Storage', () => {
            const spy = spyOn(storagePersistanceService, 'resetAuthStateInStorage');
            authStateService.setUnauthorizedAndFireEvent();
            expect(spy).toHaveBeenCalled();
        });

        it('throws event when state is being set to `false`', () => {
            const spy = spyOn((authStateService as any).authorizedInternal$, 'next');
            authStateService.setUnauthorizedAndFireEvent();
            expect(spy).toHaveBeenCalledWith(false);
        });
    });

    describe('updateAndPublishAuthState', () => {
        it('calls eventsService', () => {
            spyOn(eventsService, 'fireEvent');
            authStateService.updateAndPublishAuthState({ authorizationState: null, isRenewProcess: false, validationResult: null });
            expect(eventsService.fireEvent).toHaveBeenCalledWith(EventTypes.NewAuthorizationResult, jasmine.any(Object));
        });
    });

    describe('setAuthorizationData', () => {
        it('stores accessToken', () => {
            const spy = spyOn(storagePersistanceService, 'write');
            authStateService.setAuthorizationData('accesstoken', 'not used');
            expect(spy).toHaveBeenCalledWith('authorizationData', 'accesstoken');
        });

        it('stores accessToken', () => {
            const spy = spyOn(storagePersistanceService, 'write');
            authStateService.setAuthorizationData('not used', 'idtoken');
            expect(spy).toHaveBeenCalledWith('authorizationDataIdToken', 'idtoken');
        });

        it('calls setAuthorizedAndFireEvent() method', () => {
            const spy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
            authStateService.setAuthorizationData('not used', 'idtoken');
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('getAccessToken', () => {
        it('isAuthorized is false returns empty string', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('');
            const result = authStateService.getAccessToken();
            expect(result).toBe('');
        });

        it('isAuthorized is true returns decodeURIComponent(token)', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');
            const result = authStateService.getAccessToken();
            expect(result).toBe(decodeURIComponent('HenloLegger'));
        });
    });

    describe('getIdToken', () => {
        it('isAuthorized is false returns empty string', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('');
            const result = authStateService.getIdToken();
            expect(result).toBe('');
        });

        it('isAuthorized is true returns decodeURIComponent(token)', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');
            const result = authStateService.getIdToken();
            expect(result).toBe(decodeURIComponent('HenloFuriend'));
        });
    });

    describe('getRefreshToken', () => {
        it('isAuthorized is false returns empty string', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('');
            const result = authStateService.getRefreshToken();
            expect(result).toBe('');
        });

        it('isAuthorized is truereturns decodeURIComponent(token)', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');
            spyOn(storagePersistanceService, 'getRefreshToken').and.returnValue('HenloRefreshLegger');
            const result = authStateService.getRefreshToken();
            expect(result).toBe(decodeURIComponent('HenloRefreshLegger'));
        });
    });

    describe('areAuthStorageTokensValid', () => {
        it('isAuthorized is false returns false', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('');
            const result = authStateService.areAuthStorageTokensValid();
            expect(result).toBeFalse();
        });

        it('isAuthorized is true and id_token is expired returns true', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');

            spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(true);
            spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
            const result = authStateService.areAuthStorageTokensValid();
            expect(result).toBeFalse();
        });

        it('isAuthorized is true  and access_token is expired returns true', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');

            spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
            spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);
            const result = authStateService.areAuthStorageTokensValid();
            expect(result).toBeFalse();
        });

        it('isAuthorized is true  and id_token is not expired returns true', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');

            spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
            spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
            const result = authStateService.areAuthStorageTokensValid();
            expect(result).toBeTrue();
        });

        it('authState is AuthorizedState.Authorized and id_token is not expired fires event', () => {
            spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('HenloLegger');
            spyOn(storagePersistanceService, 'getIdToken').and.returnValue('HenloFuriend');

            spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
            spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
            const result = authStateService.areAuthStorageTokensValid();
            expect(result).toBeTrue();
        });
    });

    describe('hasIdTokenExpired', () => {
        it('tokenValidationService gets called with id token if id_token is set', () => {
            configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
            const spy = spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);
            spyOn(storagePersistanceService, 'read').withArgs('authorizationDataIdToken').and.returnValue('idToken');
            authStateService.hasIdTokenExpired();
            expect(spy).toHaveBeenCalledWith('idToken', 30);
        });

        it('fires event if idToken is expired', () => {
            configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
            spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);

            const spy = spyOn(eventsService, 'fireEvent');

            spyOn(storagePersistanceService, 'read').withArgs('authorizationDataIdToken').and.returnValue('idToken');
            const result = authStateService.hasIdTokenExpired();
            expect(result).toBe(true);
            expect(spy).toHaveBeenCalledWith(EventTypes.IdTokenExpired, true);
        });

        it('does NOT fire event if idToken is NOT expired', () => {
            configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
            spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => false);

            const spy = spyOn(eventsService, 'fireEvent');

            spyOn(storagePersistanceService, 'read').withArgs('authorizationDataIdToken').and.returnValue('idToken');
            const result = authStateService.hasIdTokenExpired();
            expect(result).toBe(false);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('hasAccessTokenExpiredIfExpiryExists', () => {
        it('negates the result of internal call of `validateAccessTokenNotExpired`', () => {
            const validateAccessTokenNotExpiredResult = true;
            const expectedResult = !validateAccessTokenNotExpiredResult;
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
            const date = new Date();
            spyOn(storagePersistanceService, 'read').withArgs('access_token_expires_at').and.returnValue(date);
            const spy = spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
            const result = authStateService.hasAccessTokenExpiredIfExpiryExists();
            expect(spy).toHaveBeenCalledWith(date, 5);
            expect(result).toEqual(expectedResult);
        });

        it('throws event when token is expired', () => {
            const validateAccessTokenNotExpiredResult = false;
            const expectedResult = !validateAccessTokenNotExpiredResult;
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
            const date = new Date();

            spyOn(eventsService, 'fireEvent');

            spyOn(storagePersistanceService, 'read').withArgs('access_token_expires_at').and.returnValue(date);
            spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
            authStateService.hasAccessTokenExpiredIfExpiryExists();
            expect(eventsService.fireEvent).toHaveBeenCalledWith(EventTypes.TokenExpired, expectedResult);
        });
    });
});
