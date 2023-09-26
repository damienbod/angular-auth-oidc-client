import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUrlService {
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  getStateParamFromCurrentUrl(url?: string): string | null {
    const currentUrl = url || this.getCurrentUrl();

    if (!currentUrl) {
      return null;
    }

    const parsedUrl = new URL(currentUrl);
    const urlParams = new URLSearchParams(parsedUrl.search);

    return urlParams.get('state');
  }

  getCurrentUrl(): string | null {
    return this.document?.defaultView?.location.toString() ?? null;
  }
}
