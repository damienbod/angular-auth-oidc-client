import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlatformProvider } from './platform.provider';

describe('PlatformProvider Tests', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      providers: [PlatformProvider, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const service = TestBed.inject(PlatformProvider);

    expect(service).toBeTruthy();
  });

  it('isBrowser equals true if "isPlatformBrowser" is true', () => {
    TestBed.configureTestingModule({
      providers: [PlatformProvider, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const service = TestBed.inject(PlatformProvider);

    expect(service.isBrowser()).toBe(true);
  });

  it('isBrowser equals true if "isPlatformBrowser" is true', () => {
    TestBed.configureTestingModule({
      providers: [PlatformProvider, { provide: PLATFORM_ID, useValue: 'notABrowser' }],
    });

    const service = TestBed.inject(PlatformProvider);

    expect(service.isBrowser()).toBe(false);
  });
});
