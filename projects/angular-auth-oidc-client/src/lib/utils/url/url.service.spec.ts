import { TestBed } from '@angular/core/testing';
import { UrlService } from './url.service';

describe('ConfigurationProviderTests', () => {
    let service: UrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UrlService],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(UrlService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('parses Url correctly with hash in the end', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';
        const code = service.getUrlParameter(urlToCheck, 'code');
        const state = service.getUrlParameter(urlToCheck, 'state');

        expect(code).toBe('thisisacode');
        expect(state).toBe('0000.1234.000');
    });

    it('parses url with special chars in param and hash in the end', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisa$-_.+!*(),code&state=0000.1234.000#';
        const code = service.getUrlParameter(urlToCheck, 'code');
        const state = service.getUrlParameter(urlToCheck, 'state');

        expect(code).toBe('thisisa$-_.+!*(),code');
        expect(state).toBe('0000.1234.000');
    });

    it('parses Url correctly with number&delimiter in params', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000';
        const code = service.getUrlParameter(urlToCheck, 'code');
        const state = service.getUrlParameter(urlToCheck, 'state');

        expect(code).toBe('thisisacode');
        expect(state).toBe('0000.1234.000');
    });

    it('gets correct param if params divided vith slash', () => {
        const urlToCheck = 'https://www.example.com/signin?state=0000.1234.000&ui_locales=de&code=thisisacode#lang=de';
        const code = service.getUrlParameter(urlToCheck, 'code');
        const state = service.getUrlParameter(urlToCheck, 'state');

        expect(code).toBe('thisisacode');
        expect(state).toBe('0000.1234.000');
    });
});
