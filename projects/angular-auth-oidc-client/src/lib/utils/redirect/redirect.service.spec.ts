import { DOCUMENT } from '@angular/common';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { RedirectService } from './redirect.service';

describe('RedirectService', () => {
  let spec: SpectatorService<RedirectService>;
  let service: RedirectService;
  let myDocument: any;

  const createService = createServiceFactory({
    service: RedirectService,
    providers: [
      {
        provide: DOCUMENT,
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

  beforeEach(() => {
    spec = createService();
    service = spec.service;
    myDocument = spec.inject(DOCUMENT);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(myDocument).toBeTruthy();
  });

  it('redirectTo sets window location href', () => {
    const spy = spyOnProperty(myDocument.location, 'href', 'set');
    service.redirectTo('anyurl');
    expect(spy).toHaveBeenCalledWith('anyurl');
  });
});
