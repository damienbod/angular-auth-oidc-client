import { TestBed } from '@angular/core/testing';
import { WINDOW } from '../window/window.reference';
import { RedirectService } from './redirect.service';

describe('Redirect Service Tests', () => {
    let service: RedirectService;
    let mywindow: any;

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

        mywindow = TestBed.inject(WINDOW);
    });

    beforeEach(() => {
        service = TestBed.inject(RedirectService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
        expect(mywindow).toBeTruthy();
    });

    it('redirectTo sets window location href', () => {
        const spy = spyOnProperty(mywindow.location, 'href', 'set');
        service.redirectTo('anyurl');
        expect(spy).toHaveBeenCalledWith('anyurl');
    });
});
