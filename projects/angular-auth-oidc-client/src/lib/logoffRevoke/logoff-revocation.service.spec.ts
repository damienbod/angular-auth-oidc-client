import { async, TestBed } from '@angular/core/testing';
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

describe('Signin Key Data Service', () => {
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
        fit('run', async(() => {
            const token = 'ddddddd';
            // spyOn(urlService, 'createRevocationEndpointBodyAccessToken').and.returnValue(
            //     `client_id=test&token=${token}&token_type_hint=access_token`
            // );

            const result = service.revokeAccessToken(token);

            result.subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });

            // expect(urlService.createRevocationEndpointBodyAccessToken).toHaveBeenCalled();
        }));
    });
});
