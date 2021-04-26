import { Injectable } from '@angular/core';
import { StoragePersistenceService } from '../storage/storage-persistence.service';

const STORAGE_KEY = 'redirect';

@Injectable()
export class AutoLoginService {
  constructor(private readonly storageService: StoragePersistenceService) {}
  getStoredRedirectRoute() {
    return this.storageService.read(STORAGE_KEY);
  }

  saveStoredRedirectRoute(url: string) {
    this.storageService.write(STORAGE_KEY, url);
  }

  deleteStoredRedirectRoute() {
    this.storageService.remove(STORAGE_KEY);
  }
}
