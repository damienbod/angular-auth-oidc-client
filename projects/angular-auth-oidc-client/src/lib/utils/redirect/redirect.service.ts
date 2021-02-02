import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RedirectService {
  constructor(@Inject(DOCUMENT) private readonly doc: any) {}

  redirectTo(url) {
    this.doc.location.href = url;
  }
}
