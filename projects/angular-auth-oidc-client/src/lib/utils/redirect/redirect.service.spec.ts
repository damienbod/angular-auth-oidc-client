import { TestBed } from '@angular/core/testing';
import { WINDOW } from '../window/window.reference';
import { RedirectService } from './redirect.service';

describe('Redirect Service Tests', () => {
    let service: RedirectService;
    let _window: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RedirectService,
                {
                    provide: WINDOW,
                    useValue: {
                        location: {
                            get href() {
                                return 'fakeUrl';
                            },
                            set href(v) {},
                        },
                    },
                },
            ],
        });

        _window = TestBed.inject(WINDOW);
    });

    beforeEach(() => {
        service = TestBed.inject(RedirectService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
        expect(_window).toBeTruthy();
    });

    it('redirectTo sets window location href', () => {
        const spy = spyOnProperty(_window.location, 'href', 'set');
        service.redirectTo('anyurl');
        expect(spy).toHaveBeenCalledWith('anyurl');
    });
});
