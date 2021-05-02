import { Injectable } from '@angular/core';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService) {}

  /**
   * Gets the stored redirect route from storage.
   */
  getStoredRedirectRoute(configId: string): string {
    return this.storageService.read(STORAGE_KEY, configId);
  }

  /**
   * Saves the redirect url to storage.
   *
   * @param url The redirect url to save.
   */
  saveStoredRedirectRoute(configId: string, url: string) {
    this.storageService.write(STORAGE_KEY, url, configId);
  }

  /**
   * Removes the redirect url from storage.
   */
  deleteStoredRedirectRoute(configId: string): void {
    this.storageService.remove(STORAGE_KEY, configId);
  }
}
