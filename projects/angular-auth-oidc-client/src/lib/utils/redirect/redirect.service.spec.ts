import { TestBed } from '@angular/core/testing';
import { WindowToken } from '../window/window.reference';
import { RedirectService } from './redirect.service';

const MockWindow = {
    location: {
        _href: '',
        set href(url: string) {
            this._href = url;
        },
        get href() {
            return this._href;
        },
    },
};

describe('Redirect Service Tests', () => {
    let service: RedirectService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RedirectService, { provide: WindowToken, useValue: MockWindow }],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(RedirectService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('redirectTo sets window location href', () => {
        const hrefSetSpy = spyOnProperty(MockWindow.location, 'href', 'set');
        service.redirectTo('anyurl');
        expect(hrefSetSpy).toHaveBeenCalledWith('anyurl');
    });
});
