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

        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ clientId: storagePrefix });
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    // describe('authResult', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.authResult;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_authorizationResult`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.authResult = valueToStore;

    //         const keyToWrite = `${storagePrefix}_authorizationResult`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('accessToken', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.accessToken;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_authorizationData`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.accessToken;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_authorizationData`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.accessToken = valueToStore;

    //         const keyToWrite = `${storagePrefix}_authorizationData`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('idToken', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.idToken;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_authorizationDataIdToken`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.idToken;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_authorizationDataIdToken`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.idToken = valueToStore;

    //         const keyToWrite = `${storagePrefix}_authorizationDataIdToken`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('userData', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.userData;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_userData`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.userData = valueToStore;

    //         const keyToWrite = `${storagePrefix}_userData`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('authNonce', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.authNonce;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_authNonce`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.authNonce;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_authNonce`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.authNonce = valueToStore;

    //         const keyToWrite = `${storagePrefix}_authNonce`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('codeVerifier', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.codeVerifier;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_codeVerifier`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.codeVerifier;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_codeVerifier`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.codeVerifier = valueToStore;

    //         const keyToWrite = `${storagePrefix}_codeVerifier`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('authStateControl', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.authStateControl;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_authStateControl`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.authStateControl;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_authStateControl`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.authStateControl = valueToStore;

    //         const keyToWrite = `${storagePrefix}_authStateControl`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('session_state', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.sessionState;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_session_state`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'someValue';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.sessionState = valueToStore;

    //         const keyToWrite = `${storagePrefix}_session_state`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('silentRenewRunning', () => {
    //     it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.silentRenewRunning;

    //         expect(result).toBe(returnValue);
    //         const keyToRead = `${storagePrefix}_storageSilentRenewRunning`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('get calls oidcSecurityStorage.read with correct key and returns null -> expect empty string', () => {
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(null);
    //         const result = service.silentRenewRunning;

    //         expect(result).toBe('');
    //         const keyToRead = `${storagePrefix}_storageSilentRenewRunning`;
    //         expect(spy).toHaveBeenCalledWith(keyToRead);
    //     });

    //     it('set calls "oidcSecurityStorage.write" with correct prefix_key and value', () => {
    //         const valueToStore = 'running';
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.silentRenewRunning = valueToStore;

    //         const keyToWrite = `${storagePrefix}_storageSilentRenewRunning`;
    //         expect(writeSpy).toHaveBeenCalledWith(keyToWrite, valueToStore);
    //     });
    // });

    // describe('resetStorageFlowData', () => {
    //     it('resets all values', () => {
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.resetStorageFlowData();

    //         expect(writeSpy).toHaveBeenCalledTimes(4);
    //     });
    // });
    // describe('resetAuthStateInStorage', () => {
    //     it('resets all values', () => {
    //         const writeSpy = spyOn(securityStorage, 'write').and.callFake(() => {});
    //         service.resetAuthStateInStorage();

    //         expect(writeSpy).toHaveBeenCalledTimes(3);
    //     });
    // });

    // describe('getAccessToken', () => {
    //     it('calls "oidcSecurityStorage.read" with correct prefix_key', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.getAccessToken();
    //         expect(spy).toHaveBeenCalledWith('storagePrefix_authorizationData');
    //         expect(result).toBe(result);
    //     });
    // });

    // describe('getIdToken', () => {
    //     it('calls "oidcSecurityStorage.read" with correct prefix_key', () => {
    //         const returnValue = 'someValue';
    //         const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
    //         const result = service.getIdToken();
    //         expect(spy).toHaveBeenCalledWith('storagePrefix_authorizationDataIdToken');
    //         expect(result).toBe(result);
    //     });
    // });

    // describe('getRefreshToken', () => {
    //     it('returns null if there is not authresult', () => {
    //         spyOnProperty(service, 'authResult', 'get').and.returnValue(null);
    //         const result = service.getRefreshToken();
    //         expect(result).toBeFalsy();
    //     });

    //     it('returns refresh_token if there is an authresult.refreshtoken', () => {
    //         spyOnProperty(service, 'authResult', 'get').and.returnValue({ refresh_token: 'refresh_token' });
    //         const result = service.getRefreshToken();
    //         expect(result).toBe('refresh_token');
    //     });
    // });
});
