import { TestBed } from '@angular/core/testing';
import { UrlParserService } from './../../lib/services/url-parser.service';

describe('ConfigurationProviderTests', () => {
    let service: UrlParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UrlParserService],
        });
    });

    beforeEach(() => {
        service = TestBed.get(UrlParserService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('parses Url correctly', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';
        const code = service.getUrlParameter(urlToCheck, 'code');
        const state = service.getUrlParameter(urlToCheck, 'state');

        expect(code).toBe('thisisacode');
        expect(state).toBe('0000.1234.000');
    });
});
