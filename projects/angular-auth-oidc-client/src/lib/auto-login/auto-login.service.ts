import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService, private readonly router: Router) {}

  checkSavedRedirectRouteAndNavigate(configId: string): void {
    const savedRouteForRedirect = this.getStoredRedirectRoute(configId);

    if (savedRouteForRedirect) {
      this.deleteStoredRedirectRoute(configId);
      this.router.navigateByUrl(savedRouteForRedirect);
    }
  }

  /**
   * Saves the redirect URL to storage.
   *
   * @param url The redirect URL to save.
   */
  saveRedirectRoute(configId: string, url: string): void {
    this.storageService.write(STORAGE_KEY, url, configId);
  }

  /**
   * Gets the stored redirect URL from storage.
   */
  private getStoredRedirectRoute(configId: string): string {
    return this.storageService.read(STORAGE_KEY, configId);
  }

  /**
   * Removes the redirect URL from storage.
   */
  private deleteStoredRedirectRoute(configId: string): void {
    this.storageService.remove(STORAGE_KEY, configId);
  }
}
