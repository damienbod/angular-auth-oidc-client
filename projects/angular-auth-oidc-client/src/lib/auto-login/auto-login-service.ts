import { Injectable } from '@angular/core';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  getStoredRedirectRoute() {
    return localStorage.getItem(STORAGE_KEY);
  }

  saveStoredRedirectRoute(url: string) {
    localStorage.setItem(STORAGE_KEY, url);
  }

  deleteStoredRedirectRoute() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
