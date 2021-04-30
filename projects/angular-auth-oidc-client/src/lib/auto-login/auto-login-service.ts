import { Injectable } from '@angular/core';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService) {}

  /**
   * Gets the stored redirect route from storage.
   */
  getStoredRedirectRoute(): string {
    return this.storageService.read(STORAGE_KEY);
  }

  /**
   * Saves the redirect url to storage.
   *
   * @param url The redirect url to save.
   */
  saveStoredRedirectRoute(url: string) {
    this.storageService.write(STORAGE_KEY, url);
  }

  /**
   * Removes the redirect url from storage.
   */
  deleteStoredRedirectRoute(): void {
    this.storageService.remove(STORAGE_KEY);
  }
}
