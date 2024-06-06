import { HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { DataService } from './data.service';
import { HttpBaseService } from './http-base.service';

describe('Data Service', () => {
  let dataService: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [DataService, HttpBaseService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
  });

  beforeEach(() => {
    dataService = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(dataService).toBeTruthy();
  });

  describe('get', () => {
    it('get call sets the accept header', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .get(url, { configId: 'configId1' })
        .subscribe((data: unknown) => {
          expect(data).toBe('bodyData');
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('get call with token the accept header and the token', waitForAsync(() => {
      const url = 'testurl';
      const token = 'token';

      dataService
        .get(url, { configId: 'configId1' }, token)
        .subscribe((data: unknown) => {
          expect(data).toBe('bodyData');
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + token);

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('call without ngsw-bypass param by default', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .get(url, { configId: 'configId1' })
        .subscribe((data: unknown) => {
          expect(data).toBe('bodyData');
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBeNull();

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('call with ngsw-bypass param', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .get(url, { configId: 'configId1', ngswBypass: true })
        .subscribe((data: unknown) => {
          expect(data).toBe('bodyData');
        });
      const req = httpMock.expectOne(url + '?ngsw-bypass=');

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBe('');

      req.flush('bodyData');

      httpMock.verify();
    }));
  });

  describe('post', () => {
    it('call sets the accept header when no other params given', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' })
        .subscribe();
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('call sets custom headers ONLY (No ACCEPT header) when custom headers are given', waitForAsync(() => {
      const url = 'testurl';
      let headers = new HttpHeaders();

      headers = headers.set('X-MyHeader', 'Genesis');

      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' }, headers)
        .subscribe();
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-MyHeader')).toEqual('Genesis');
      expect(req.request.headers.get('X-MyHeader')).not.toEqual('Genesis333');

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('call without ngsw-bypass param by default', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' })
        .subscribe();
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBeNull();

      req.flush('bodyData');

      httpMock.verify();
    }));

    it('call with ngsw-bypass param', waitForAsync(() => {
      const url = 'testurl';

      dataService
        .post(
          url,
          { some: 'thing' },
          { configId: 'configId1', ngswBypass: true }
        )
        .subscribe();
      const req = httpMock.expectOne(url + '?ngsw-bypass=');

      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBe('');

      req.flush('bodyData');

      httpMock.verify();
    }));
  });
});
