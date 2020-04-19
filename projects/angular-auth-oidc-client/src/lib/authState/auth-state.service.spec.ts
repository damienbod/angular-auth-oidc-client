import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { ConfigurationProvider } from '../config/config.provider';
import { EventsService } from '../events';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { AuthStateService } from './auth-state.service';
import { AuthorizedState } from './authorized-state';

fdescribe('Auth State Service', () => {
    let authStateService: AuthStateService;
    let storagePersistanceService: StoragePersistanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ConfigurationProvider,
                AuthStateService,
                EventsService,
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
    });

    it('should create', () => {
        expect(authStateService).toBeTruthy();
    });

    it('public authorize$ is observable$', () => {
        expect(authStateService.authorized$).toEqual(jasmine.any(Observable));
    });

    //  setAuthorizedAndFireEvent(): void {
    //     // set the correct values in storage
    //     this.authState = AuthorizedState.Authorized;
    //     this.persistAuthStateInStorage(this.authState);
    //     this.authorizedInternal$.next(true);
    // }

    describe('setAuthorizedAndFireEvent', () => {
        it('sets the authstate to AuthorizedState.Authorized', () => {
            authStateService.setAuthorizedAndFireEvent();
            expect((authStateService as any).authState).toBe(AuthorizedState.Authorized);
        });

        it('persist AuthState In Storage', () => {
            spyOnProperty(storagePersistanceService, 'authorizedState', 'set');
            authStateService.setAuthorizedAndFireEvent();
            expect((authStateService as any).authState).toBe(AuthorizedState.Authorized);
        });
    });
});
