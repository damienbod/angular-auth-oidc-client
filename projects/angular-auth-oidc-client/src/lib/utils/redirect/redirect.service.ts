import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RedirectService {
  private readonly document = inject<Document>(DOCUMENT);

  redirectTo(url: string): void {
    this.document.location.href = url;
  }
}
