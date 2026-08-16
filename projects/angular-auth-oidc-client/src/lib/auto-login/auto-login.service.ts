import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  private readonly storageService = inject(StoragePersistenceService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  checkSavedRedirectRouteAndNavigate(config: OpenIdConfiguration | null): void {
    if (!config) {
      return;
    }
    const savedRouteForRedirect = this.getStoredRedirectRoute(config);

    if (savedRouteForRedirect != null) {
      this.deleteStoredRedirectRoute(config);
      this.router.navigateByUrl(savedRouteForRedirect);
    }
  }

  /**
   * Saves the redirect URL per browser tab, so concurrent logins in other tabs cannot overwrite it.
   *
   * @param config The OpenId configuration.
   * @param url The redirect URL to save.
   */
  saveRedirectRoute(config: OpenIdConfiguration | null, url: string): void {
    if (!config) {
      return;
    }

    const tabLocalStorage = this.document.defaultView?.sessionStorage;

    if (tabLocalStorage) {
      tabLocalStorage.setItem(`${config.configId}-${STORAGE_KEY}`, url);
    } else {
      this.storageService.write(STORAGE_KEY, url, config);
    }
  }

  /**
   * Gets the stored redirect URL from storage.
   */
  private getStoredRedirectRoute(config: OpenIdConfiguration): string | null {
    const tabLocalRoute = this.document.defaultView?.sessionStorage?.getItem(
      `${config.configId}-${STORAGE_KEY}`
    );

    // the configured storage still serves logins started before the route became tab-local
    return tabLocalRoute ?? this.storageService.read(STORAGE_KEY, config);
  }

  /**
   * Removes the redirect URL from storage.
   */
  private deleteStoredRedirectRoute(config: OpenIdConfiguration): void {
    this.document.defaultView?.sessionStorage?.removeItem(
      `${config.configId}-${STORAGE_KEY}`
    );
    this.storageService.remove(STORAGE_KEY, config);
  }
}
