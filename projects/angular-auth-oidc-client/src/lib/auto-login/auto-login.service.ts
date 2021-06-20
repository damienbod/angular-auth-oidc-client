import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService, private readonly router: Router) {}

  checkSavedRedirectRouteAndNavigate(isAuthenticated: boolean, configId: string): void {
    if (!isAuthenticated) {
      return;
    }

    const savedRouteForRedirect = this.getStoredRedirectRoute(configId);

    if (savedRouteForRedirect) {
      this.deleteStoredRedirectRoute(configId);
      this.router.navigateByUrl(savedRouteForRedirect);
    }
  }

  /**
   * Saves the redirect url to storage.
   *
   * @param url The redirect url to save.
   */
  saveRedirectRoute(configId: string, url: string): void {
    this.storageService.write(STORAGE_KEY, url, configId);
  }

  /**
   * Gets the stored redirect route from storage.
   */
  private getStoredRedirectRoute(configId: string): string {
    return this.storageService.read(STORAGE_KEY, configId);
  }

  /**
   * Removes the redirect url from storage.
   */
  private deleteStoredRedirectRoute(configId: string): void {
    this.storageService.remove(STORAGE_KEY, configId);
  }
}
