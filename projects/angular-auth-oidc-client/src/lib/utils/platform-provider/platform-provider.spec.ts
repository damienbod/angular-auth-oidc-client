import { PLATFORM_ID } from '@angular/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { PlatformProvider } from './platform.provider';

describe('PlatformProvider Tests', () => {
  describe('platform browser', () => {
    let spec: SpectatorService<PlatformProvider>;
    let service: PlatformProvider;

    const provider = { provide: PLATFORM_ID, useValue: 'browser' };

    const createService = createServiceFactory({
      service: PlatformProvider,
      providers: [provider],
    });

    beforeEach(() => {
      spec = createService();
      service = spec.service;
    });

    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('isBrowser equals true if "isPlatformBrowser" is true', () => {
      expect(service.isBrowser).toBe(true);
    });
  });

  describe('platform not a browser', () => {
    let spec: SpectatorService<PlatformProvider>;
    let service: PlatformProvider;

    const provider = { provide: PLATFORM_ID, useValue: 'notABrowser' };

    const createService = createServiceFactory({
      service: PlatformProvider,
      providers: [provider],
    });

    beforeEach(() => {
      spec = createService();
      service = spec.service;
    });

    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('isBrowser equals false if platform is not a browser', () => {
      expect(service.isBrowser).toBe(false);
    });
  });
});
