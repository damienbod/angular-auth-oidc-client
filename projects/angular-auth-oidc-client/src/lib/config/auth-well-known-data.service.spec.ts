import { TestBed } from '@angular/core/testing';
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
        // it('should add suffix if it does not exist on current url', () => {
        //     const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
        //         return of(null);
        //     });
        //     const urlWithoutSuffix = 'myUrl';
        //     const urlWithSuffix = `${urlWithoutSuffix}/.well-known/openid-configuration`;
        //     service.getWellKnownDocument(urlWithoutSuffix);
        //     expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        // });
        // it('should not add suffix if it does exist on current url', () => {
        //     const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
        //         return of(null);
        //     });
        //     const urlWithSuffix = `myUrl/.well-known/openid-configuration`;
        //     service.getWellKnownDocument(urlWithSuffix);
        //     expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        // });
        // it('should not add suffix if it does exist in the middle of current url', () => {
        //     const dataServiceSpy = spyOn(dataService, 'get').and.callFake((url) => {
        //         return of(null);
        //     });
        //     const urlWithSuffix = `myUrl/.well-known/openid-configuration/and/some/more/stuff`;
        //     service.getWellKnownDocument(urlWithSuffix);
        //     expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix);
        // });
    });
});
