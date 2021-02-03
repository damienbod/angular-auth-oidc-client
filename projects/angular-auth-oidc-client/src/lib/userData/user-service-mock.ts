import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable()
export class UserServiceMock {
  private userDataInternal$ = new BehaviorSubject<any>(null);

  get userData$() {
    return this.userDataInternal$.asObservable();
  }

  getAndPersistUserDataInStore(isRenewProcess = false, idToken?: any, decodedIdToken?: any): Observable<any> {
    return of(null);
  }

  getUserDataFromStore(): any {
    return null;
  }

  publishUserdataIfExists() {}

  setUserDataToStore(value: any): void {}

  resetUserDataInStore(): void {}
}
