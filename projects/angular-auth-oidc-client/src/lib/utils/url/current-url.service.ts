import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class CurrentUrlService {
  constructor(@Inject(DOCUMENT) private readonly doc: any) {}

  getStateParamFromCurrentUrl(url?: string): string {
    const currentUrl = url ?? this.getCurrentUrl();
    const parsedUrl = new URL(currentUrl);
    const urlParams = new URLSearchParams(parsedUrl.search);
    const stateFromUrl = urlParams.get('state');

    // TODO Maybe return null here if not found
    return stateFromUrl;
  }

  getCurrentUrl(): string {
    return this.doc.defaultView.location.toString();
  }
}
