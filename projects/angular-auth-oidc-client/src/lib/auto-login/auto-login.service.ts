import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService, private readonly router: Router) {}

  checkSavedRedirectRouteAndNavigate(config: OpenIdConfiguration): void {
    const savedRouteForRedirect = this.getStoredRedirectRoute(config);

    if (savedRouteForRedirect) {
      this.deleteStoredRedirectRoute(config);
      this.router.navigateByUrl(savedRouteForRedirect);
    }
  }

  /**
   * Saves the redirect URL to storage.
   *
   * @param config The OpenId configuration.
   * @param url The redirect URL to save.
   */
  saveRedirectRoute(config: OpenIdConfiguration, url: string): void {
    alert('savin ' + url);
    this.storageService.write(STORAGE_KEY, url, config);
  }

  /**
   * Gets the stored redirect URL from storage.
   */
  private getStoredRedirectRoute(config: OpenIdConfiguration): string {
    return this.storageService.read(STORAGE_KEY, config);
  }

  /**
   * Removes the redirect URL from storage.
   */
  private deleteStoredRedirectRoute(config: OpenIdConfiguration): void {
    this.storageService.remove(STORAGE_KEY, config);
  }
}
