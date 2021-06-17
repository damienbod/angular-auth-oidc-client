import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class CurrentUrlService {
  constructor(@Inject(DOCUMENT) private doc: any) {}

  getStateParamFromCurrentUrl(): string {
    const currentUrl = this.getCurrentUrl();
    const parsedUrl = new URL(currentUrl);
    const urlParams = new URLSearchParams(parsedUrl.search);
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
