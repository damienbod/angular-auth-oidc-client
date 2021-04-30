import { Injectable } from '@angular/core';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  /**
   * Gets the stored redirect route from storage.
   */
  getStoredRedirectRoute(): string {
    return localStorage.getItem(STORAGE_KEY);
  }

  /**
   * Saves the redirect url to storage.
   *
   * @param url The redirect url to save.
   */
  saveStoredRedirectRoute(url: string): void {
    localStorage.setItem(STORAGE_KEY, url);
  }

  /**
   * Removes the redirect url from storage.
   */
  deleteStoredRedirectRoute(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
