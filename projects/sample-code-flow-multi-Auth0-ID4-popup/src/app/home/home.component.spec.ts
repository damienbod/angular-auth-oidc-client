import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { OidcSecurityService, provideAuth } from 'angular-auth-oidc-client';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [provideAuth({ config: {} })],
    }).compileComponents();
  });

  beforeEach(() => {
    const oidcSecurityService = TestBed.inject(OidcSecurityService);

    vi.spyOn(oidcSecurityService, 'getConfigurations').mockReturnValue([
      { configId: 'configId1' },
      { configId: 'configId2' },
    ]);

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
