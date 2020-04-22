import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { BrowserStorageService } from './browser-storage.service';

describe('Browser Service', () => {
    let service: BrowserStorageService;
    let configurationProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BrowserStorageService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
            ],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);
        service = TestBed.inject(BrowserStorageService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('read', () => {
        it('returns null if there is no storage', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(false);
            expect(service.read('anything')).toBeFalse();
        });

        it('returns false if getStorage returns null', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);
            spyOn(service as any, 'getStorage').and.returnValue(null);
            expect(service.read('anything')).toBeFalse();
        });

        it('returns null if getItem returns null', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);
            const returnValue = null;

            spyOn(service as any, 'getStorage').and.returnValue({
                getItem: () => {
                    return returnValue;
                },
            });
            expect(service.read('anything')).toBeFalse();
        });

        it('returns the item if getItem returns an item', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);
            const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

            spyOn(service as any, 'getStorage').and.returnValue({
                getItem: () => {
                    return returnValue;
                },
            });
            expect(service.read('anything')).toEqual(JSON.parse(returnValue));
        });
    });

    describe('write', () => {
        it('returns null if there is no storage', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(false);
            expect(service.write('anyKey', 'anyvalue')).toBeFalse();
        });

        it('returns null if getStorage returns null', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);
            spyOn(service as any, 'getStorage').and.returnValue(null);
            expect(service.write('anyKey', 'anyvalue')).toBeFalse();
        });

        it('returns undefined if setItem gets called correctly', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);

            const serviceObject = {
                setItem: (a, b) => {},
            };

            const setItemSpy = spyOn(serviceObject, 'setItem').and.callThrough();

            spyOn(service as any, 'getStorage').and.returnValue(serviceObject);
            const result = service.write('anyKey', 'anyvalue');
            expect(result).toBe(true);
            expect(setItemSpy).toHaveBeenCalledWith('anyKey', JSON.stringify('anyvalue'));
        });

        it('writes null if item is falsy', () => {
            spyOn(service as any, 'hasStorage').and.returnValue(true);

            const serviceObject = {
                setItem: (a, b) => {},
            };

            const setItemSpy = spyOn(serviceObject, 'setItem').and.callThrough();

            const somethingFalsy = '';

            spyOn(service as any, 'getStorage').and.returnValue(serviceObject);
            const result = service.write('anyKey', somethingFalsy);
            expect(result).toBe(true);
            expect(setItemSpy).toHaveBeenCalledWith('anyKey', JSON.stringify(null));
        });
    });

    describe('getStorage', () => {
        it('returns null if there is no storage', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ storage: null });
            expect((service as any).getStorage()).toBeNull();
        });

        it('returns null if there is no openIDConfiguration', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue(null);
            expect((service as any).getStorage()).toBeFalsy();
        });
    });
});
