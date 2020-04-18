import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { HttpBaseService } from './http-base.service';

describe('Data Service', () => {
    let dataService: DataService;
    let httpBaseService: HttpBaseService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DataService, HttpBaseService],
        });
    });

    beforeEach(() => {
        dataService = TestBed.inject(DataService);
        httpBaseService = TestBed.inject(HttpBaseService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should create', () => {
        expect(dataService).toBeTruthy();
    });

    it('get call sets the accept header', async(() => {
        const url = 'anyurl';
        dataService.get(url).subscribe((data: any) => {
            expect(data).toBe('bodyData');
        });
        const req = httpMock.expectOne(url);

        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');

        req.flush('bodyData');

        httpMock.verify();
    }));

    it('get call with token the accept header and the token', async(() => {
        const url = 'anyurl';
        const token = 'token';
        dataService.get(url, token).subscribe((data: any) => {
            expect(data).toBe('bodyData');
        });
        const req = httpMock.expectOne(url);

        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        expect(req.request.headers.get('Authorization')).toBe('Bearer ' + token);

        req.flush('bodyData');

        httpMock.verify();
    }));
});
