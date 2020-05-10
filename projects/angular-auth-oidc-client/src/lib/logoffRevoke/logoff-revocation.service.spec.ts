import { TestBed } from '@angular/core/testing';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { CheckSessionService } from '../iframe/check-session.service';
import { CheckSessionServiceMock } from '../iframe/check-session.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { RedirectServiceMock } from '../utils/redirect/redirect.service-mock';
import { UrlService } from '../utils/url/url.service';
import { FlowsService } from './../flows/flows.service';
import { StoragePersistanceServiceMock } from './../storage/storage-persistance.service-mock';
import { RedirectService } from './../utils/redirect/redirect.service';
import { UrlServiceMock } from './../utils/url/url.service-mock';
import { LogoffRevocationService } from './logoff-revocation.service';

describe('Logout and Revoke Service', () => {
    let service: LogoffRevocationService;
    let dataService: DataService;
    let loggerService: LoggerService;
    let storagePersistanceService: StoragePersistanceService;
    let urlService: UrlService;
    let checkSessionService: CheckSessionService;
    let flowsService: FlowsService;
    let redirectService: RedirectService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LogoffRevocationService,
                { provide: DataService, useClass: DataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: CheckSessionService, useClass: CheckSessionServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: RedirectService, useClass: RedirectServiceMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(LogoffRevocationService);
        dataService = TestBed.inject(DataService);
        loggerService = TestBed.inject(LoggerService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        urlService = TestBed.inject(UrlService);
        checkSessionService = TestBed.inject(CheckSessionService);
        flowsService = TestBed.inject(FlowsService);
        redirectService = TestBed.inject(RedirectService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('revokeAccessToken', () => {
        it('uses token parameter if token as parameter is passed in the method', () => {
            // Arrange
            const paramToken = 'passedTokenAsParam';
            const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
            // Act
            service.revokeAccessToken(paramToken);
            // Assert
            expect(revocationSpy).toHaveBeenCalledWith(paramToken);
        });

        it('uses token parameter from persistance if no param is provided', () => {
            // Arrange
            const paramToken = 'damien';
            spyOnProperty(storagePersistanceService, 'accessToken', 'get').and.returnValue(paramToken);
            const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
            // Act
            service.revokeAccessToken();
            // Assert
            expect(revocationSpy).toHaveBeenCalledWith(paramToken);
        });
    });

    describe('revokeRefreshToken', () => {
        it('uses refresh token parameter if token as parameter is passed in the method', () => {
            // Arrange
            const paramToken = 'passedTokenAsParam';
            const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyRefreshToken');
            // Act
            service.revokeRefreshToken(paramToken);
            // Assert
            expect(revocationSpy).toHaveBeenCalledWith(paramToken);
        });

        it('uses refresh token parameter from persistance if no param is provided', () => {
            // Arrange
            const paramToken = 'damien';
            spyOn(storagePersistanceService, 'getRefreshToken').and.returnValue(paramToken);
            const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyRefreshToken');
            // Act
            service.revokeRefreshToken();
            // Assert
            expect(revocationSpy).toHaveBeenCalledWith(paramToken);
        });
    });

    describe('getEndSessionUrl', () => {
        it('uses id_token parameter from persistance if no param is provided', () => {
            // Arrange
            const paramToken = 'damienId';
            spyOnProperty(storagePersistanceService, 'idToken', 'get').and.returnValue(paramToken);
            const revocationSpy = spyOn(urlService, 'createEndSessionUrl');
            // Act
            // Act
            service.getEndSessionUrl();
            // Assert
            expect(revocationSpy).toHaveBeenCalledWith(paramToken);
        });
    });
});
