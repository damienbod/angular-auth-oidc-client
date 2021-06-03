import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class CurrentUrlService {
  constructor(@Inject(DOCUMENT) private readonly doc: Document) {}

  getStateParamFromCurrentUrl(): string {
    const currentUrl = this.getCurrentUrl();
    const urlParams = new URLSearchParams(currentUrl);
    const stateFromUrl = urlParams.get('state');
    return stateFromUrl;
  }

  currentUrlHasStateParam(): boolean {
    return !!this.getStateParamFromCurrentUrl();
  }

  getCurrentUrl(): string {
    return this.doc.defaultView.location.toString();
  }
}
