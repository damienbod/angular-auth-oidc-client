import { Injectable, inject, DOCUMENT } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUrlService {
  private readonly document: Document = inject(DOCUMENT);

  getStateParamFromCurrentUrl(url?: string): string | null {
    const currentUrl = url || this.getCurrentUrl();

    if (!currentUrl) {
      return null;
    }

    const parsedUrl = new URL(currentUrl);
    const stateFromQuery = parsedUrl.searchParams.get('state');

    if (stateFromQuery) {
      return stateFromQuery;
    }

    // The implicit flow returns its callback parameters in the fragment.
    return new URLSearchParams(parsedUrl.hash.substring(1)).get('state');
  }

  getCurrentUrl(): string | null {
    return this.document?.defaultView?.location.toString() ?? null;
  }
}
