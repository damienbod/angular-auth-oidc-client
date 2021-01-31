import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { AbstractSecurityStorage } from './abstract-security-storage';
import { BrowserStorageMock } from './browser-storage.service-mock';
import { StoragePersistanceService } from './storage-persistance.service';

describe('Storage Persistance Service', () => {
    let service: StoragePersistanceService;
    let configurationProvider: ConfigurationProvider;
    let securityStorage: AbstractSecurityStorage;
    let storageSpy: jasmine.Spy;

    const storagePrefix = 'storagePrefix';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                StoragePersistanceService,
                { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
            ],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);

        service = TestBed.inject(StoragePersistanceService);
        securityStorage = TestBed.inject(AbstractSecurityStorage);

        storageSpy = spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ clientId: storagePrefix });
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('read', () => {
        it('reads from oidcSecuriyStorage with correct key', () => {
            const spy = spyOn(securityStorage, 'read');
            service.read('authNonce');

            const keyToRead = `${storagePrefix}_authNonce`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });

        it('reads from oidcSecuriyStorage with fallback key if no config is set (not throw exception)', () => {
            storageSpy.and.returnValue(null);
            const spy = spyOn(securityStorage, 'read');
            service.read('authzData');

            const keyToRead = `_authzData`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });
    });

    describe('write', () => {
        it('writes to oidcSecuriyStorage with correct key', () => {
            const spy = spyOn(securityStorage, 'write');
            service.write('authNonce', 'anyValue');

            const keyToWrite = `${storagePrefix}_authNonce`;
            expect(spy).toHaveBeenCalledWith(keyToWrite, 'anyValue');
        });
    });

    describe('resetStorageFlowData', () => {
        it('resets the correct values', () => {
            const spy = spyOn(securityStorage, 'remove');
            service.resetStorageFlowData();

            expect(spy.calls.argsFor(0)).toEqual(['storagePrefix_session_state']);
            expect(spy.calls.argsFor(1)).toEqual(['storagePrefix_storageSilentRenewRunning']);
            expect(spy.calls.argsFor(2)).toEqual(['storagePrefix_codeVerifier']);
            expect(spy.calls.argsFor(3)).toEqual(['storagePrefix_userData']);
        });
    });

    describe('resetAuthStateInStorage', () => {
        it('resets the correct values', () => {
            const spy = spyOn(securityStorage, 'remove');
            service.resetAuthStateInStorage();

            expect(spy.calls.argsFor(0)).toEqual(['storagePrefix_authzData']);
            expect(spy.calls.argsFor(1)).toEqual(['storagePrefix_authnResult']);
        });
    });

    describe('accessToken', () => {
        it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
            const returnValue = 'someValue';
            const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
            const result = service.getAccessToken();

            expect(result).toBe(returnValue);
            const keyToRead = `${storagePrefix}_authzData`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });

        it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
            const spy = spyOn(securityStorage, 'read').and.returnValue(null);
            const result = service.getAccessToken();

            expect(result).toBeFalsy();
            const keyToRead = `${storagePrefix}_authzData`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });
    });

    describe('idToken', () => {
        it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
            const returnValue = { id_token: 'someValue' };
            const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
            const result = service.getIdToken();

            expect(result).toBe('someValue');
            const keyToRead = `${storagePrefix}_authnResult`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });

        it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
            const spy = spyOn(securityStorage, 'read').and.returnValue(null);
            const result = service.getIdToken();

            expect(result).toBeFalsy();
            const keyToRead = `${storagePrefix}_authnResult`;
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });
    });

    describe('getRefreshToken', () => {
        it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
            const returnValue = 'someValue';
            const keyToRead = `${storagePrefix}_authnResult`;
            const spy = spyOn(securityStorage, 'read').withArgs(keyToRead).and.returnValue({ refresh_token: returnValue });
            const result = service.getRefreshToken();

            expect(result).toBe(returnValue);
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });

        it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
            const keyToRead = `${storagePrefix}_authnResult`;
            const spy = spyOn(securityStorage, 'read').withArgs(keyToRead).and.returnValue({ NO_refresh_token: '' });
            const result = service.getRefreshToken();

            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });

        it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
            const keyToRead = `${storagePrefix}_authnResult`;
            const spy = spyOn(securityStorage, 'read').withArgs(keyToRead).and.returnValue(null);
            const result = service.getRefreshToken();

            expect(result).toBeUndefined();
            expect(spy).toHaveBeenCalledWith(keyToRead);
        });
    });
});
