import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

/** @dynamic */
@Injectable({ providedIn: 'root' })
export class RedirectService {
    constructor(
      @Inject(DOCUMENT) private readonly doc: Document,
    ) {}

    redirectTo(url) {
        this.doc.location.href = url;
    }
}
