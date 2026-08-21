import { beforeEach, describe, expect, it } from 'vitest';
import {
  HttpHeaders,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { HttpBaseService } from './http-base.service';

describe('Data Service', () => {
  let dataService: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        DataService,
        HttpBaseService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
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
    it('get call sets the accept header', () => {
      const url = 'testurl';
      let response: unknown;

      dataService
        .get(url, { configId: 'configId1' })
        .subscribe((data: unknown) => {
          response = data;
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush('bodyData');

      expect(response).toBe('bodyData');
      httpMock.verify();
    });

    it('get call with token the accept header and the token', () => {
      const url = 'testurl';
      const token = 'token';
      let response: unknown;

      dataService
        .get(url, { configId: 'configId1' }, token)
        .subscribe((data: unknown) => {
          response = data;
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + token);

      req.flush('bodyData');

      expect(response).toBe('bodyData');
      httpMock.verify();
    });

    it('call without ngsw-bypass param by default', () => {
      const url = 'testurl';
      let response: unknown;

      dataService
        .get(url, { configId: 'configId1' })
        .subscribe((data: unknown) => {
          response = data;
        });
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBeNull();

      req.flush('bodyData');

      expect(response).toBe('bodyData');
      httpMock.verify();
    });

    it('call with ngsw-bypass param', () => {
      const url = 'testurl';
      let response: unknown;

      dataService
        .get(url, { configId: 'configId1', ngswBypass: true })
        .subscribe((data: unknown) => {
          response = data;
        });
      const req = httpMock.expectOne(url + '?ngsw-bypass=');

      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.params.get('ngsw-bypass')).toBe('');

      req.flush('bodyData');

      expect(response).toBe('bodyData');
      httpMock.verify();
    });
  });

  describe('post', () => {
    it('call sets the accept header when no other params given', () => {
      const url = 'testurl';

      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' })
        .subscribe();
      const req = httpMock.expectOne(url);

      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush('bodyData');

      httpMock.verify();
    });

    it('call sets custom headers ONLY (No ACCEPT header) when custom headers are given', () => {
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
    });

    it('call without ngsw-bypass param by default', () => {
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
    });

    it('call with ngsw-bypass param', () => {
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
    });

    it('falls back to an empty string url when url is null', () => {
      dataService
        .post(null, { some: 'thing' }, { configId: 'configId1' })
        .subscribe();
      const req = httpMock.expectOne('');

      expect(req.request.method).toBe('POST');
      expect(req.request.url).toBe('');

      req.flush('bodyData');

      httpMock.verify();
    });
  });
});
