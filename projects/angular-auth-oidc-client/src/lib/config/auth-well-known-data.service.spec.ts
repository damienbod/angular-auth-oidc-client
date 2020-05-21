import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { AuthWellKnownDataService } from './auth-well-known-data.service';

describe('AuthWellKnownDataService', () => {
    let service: AuthWellKnownDataService;
    let dataService: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AuthWellKnownDataService, { provide: DataService, useClass: DataServiceMock }],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(AuthWellKnownDataService);
        dataService = TestBed.inject(DataService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('getWellKnownDocument', () => {
        it('should add suffix if it does not exist on current url', async(() => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });
            const urlWithoutSuffix = 'myUrl';
            const urlWithSuffix = `${urlWithoutSuffix}/.well-known/openid-configuration`;
            (service as any).getWellKnownDocument(urlWithoutSuffix).subscribe(() => {
                expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
            });
        }));

        it('should not add suffix if it does exist on current url', async(() => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });
            const urlWithSuffix = `myUrl/.well-known/openid-configuration`;
            (service as any).getWellKnownDocument(urlWithSuffix).subscribe(() => {
                expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
            });
        }));

        it('should not add suffix if it does exist in the middle of current url', async(() => {
            const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
                return of(null);
            });
            const urlWithSuffix = `myUrl/.well-known/openid-configuration/and/some/more/stuff`;
            (service as any).getWellKnownDocument(urlWithSuffix).subscribe(() => {
                expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
            });
        }));
    });

    describe('getWellKnownEndPointsFromUrl', () => {
        it('calling internal getWellKnownDocument and maps', () => {
            spyOn<any>(dataService, 'get').and.returnValue(of({ jwks_uri: 'jwks_uri' }));

            const spy = spyOn(service as any, 'getWellKnownDocument').and.callThrough();
            service.getWellKnownEndPointsFromUrl('any-url').subscribe((result) => {
                expect(spy).toHaveBeenCalled();
                expect((result as any).jwks_uri).toBeUndefined();
                expect(result.jwksUri).toBe('jwks_uri');
            });
        });
    });
});
