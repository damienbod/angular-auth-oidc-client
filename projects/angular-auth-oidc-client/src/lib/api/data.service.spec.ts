import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
import { DataService, formUrlEncodedHeaders } from './data.service';

describe('Data Service', () => {
  let dataService: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
  });

  beforeEach(() => {
    dataService = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    // Assert
    expect(dataService).toBeTruthy();
  });

  describe('get', () => {
    it('should send a GET request with the json accept header and emit the response', () => {
      // Arrange
      const url = 'testurl';
      let response: unknown;

      // Act
      dataService
        .get(url, { configId: 'configId1' })
        .subscribe((data: unknown) => (response = data));
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(response).toBe('bodyData');
    });

    it('should send the token as bearer authorization header when a token is given', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService.get(url, { configId: 'configId1' }, 'token').subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    });

    it('should send the token unchanged without url decoding it', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService.get(url, { configId: 'configId1' }, 'abc%2Fdef%').subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer abc%2Fdef%'
      );
    });

    it('should not add the ngsw-bypass param by default', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService.get(url, { configId: 'configId1' }).subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.params.has('ngsw-bypass')).toBe(false);
    });

    it('should add the ngsw-bypass param when ngswBypass is configured', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService
        .get(url, { configId: 'configId1', ngswBypass: true })
        .subscribe();
      const req = httpMock.expectOne(url + '?ngsw-bypass=');

      req.flush('bodyData');

      // Assert
      expect(req.request.params.get('ngsw-bypass')).toBe('');
    });
  });

  describe('post', () => {
    it('should send a POST request with the body and the json accept header', () => {
      // Arrange
      const url = 'testurl';
      const body = { some: 'thing' };

      // Act
      dataService.post(url, body, { configId: 'configId1' }).subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      expect(req.request.headers.get('Accept')).toBe('application/json');
    });

    it('should merge custom headers with the default accept header', () => {
      // Arrange
      const url = 'testurl';
      const headers = new HttpHeaders({ 'X-MyHeader': 'Genesis' });

      // Act
      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' }, headers)
        .subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.headers.get('X-MyHeader')).toBe('Genesis');
      expect(req.request.headers.get('Accept')).toBe('application/json');
    });

    it('should let a custom accept header override the default one', () => {
      // Arrange
      const url = 'testurl';
      const headers = new HttpHeaders({ Accept: 'text/plain' });

      // Act
      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' }, headers)
        .subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.headers.getAll('Accept')).toEqual(['text/plain']);
    });

    it('should send the form url encoded content type when using formUrlEncodedHeaders', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService
        .post(url, 'a=b', { configId: 'configId1' }, formUrlEncodedHeaders())
        .subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.headers.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );
      expect(req.request.headers.get('Accept')).toBe('application/json');
    });

    it('should not add the ngsw-bypass param by default', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService
        .post(url, { some: 'thing' }, { configId: 'configId1' })
        .subscribe();
      const req = httpMock.expectOne(url);

      req.flush('bodyData');

      // Assert
      expect(req.request.params.has('ngsw-bypass')).toBe(false);
    });

    it('should add the ngsw-bypass param when ngswBypass is configured', () => {
      // Arrange
      const url = 'testurl';

      // Act
      dataService
        .post(
          url,
          { some: 'thing' },
          { configId: 'configId1', ngswBypass: true }
        )
        .subscribe();
      const req = httpMock.expectOne(url + '?ngsw-bypass=');

      req.flush('bodyData');

      // Assert
      expect(req.request.params.get('ngsw-bypass')).toBe('');
    });
  });
});
