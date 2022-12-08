import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class CurrentUrlService {
  constructor(@Inject(DOCUMENT) private readonly document: any) {}

  getStateParamFromCurrentUrl(url?: string): string {
    const currentUrl = url || this.getCurrentUrl();
    const parsedUrl = new URL(currentUrl);
    const urlParams = new URLSearchParams(parsedUrl.search);
    const stateFromUrl = urlParams.get('state');

    return stateFromUrl;
  }

  getCurrentUrl(): string {
    return this.document.defaultView.location.toString();
  }
}
