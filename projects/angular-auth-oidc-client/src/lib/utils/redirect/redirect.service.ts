import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RedirectService {
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  redirectTo(url): void {
    this.document.location.href = url;
  }
}
