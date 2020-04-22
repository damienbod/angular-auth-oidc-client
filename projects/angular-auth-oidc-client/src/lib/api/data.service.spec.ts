import { HttpHeaders } from '@angular/common/http';
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

    describe('get', () => {
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

    describe('post', () => {
        it('call sets the accept header when no other params given', async(() => {
            const url = 'anyurl';
            dataService.post(url, { any: 'thing' }).subscribe();
            const req = httpMock.expectOne(url);

            expect(req.request.method).toBe('POST');
            expect(req.request.headers.get('Accept')).toBe('application/json');

            req.flush('bodyData');

            httpMock.verify();
        }));

        it('call sets custom headers ONLY (No ACCEPT header) when custom headers are given', async(() => {
            const url = 'anyurl';
            let headers = new HttpHeaders();
            headers = headers.set('X-MyHeader', 'Genesis');

            dataService.post(url, { any: 'thing' }, headers).subscribe();
            const req = httpMock.expectOne(url);

            expect(req.request.method).toBe('POST');
            expect(req.request.headers.get('X-MyHeader')).toEqual('Genesis');
            expect(req.request.headers.get('X-MyHeader')).not.toEqual('Genesis333');

            req.flush('bodyData');

            httpMock.verify();
        }));
    });
});
