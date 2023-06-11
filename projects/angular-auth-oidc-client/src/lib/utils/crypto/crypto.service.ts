import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  constructor(@Inject(DOCUMENT) private readonly doc: Document) {}

  getCrypto(): any {
    // support for IE,  (window.crypto || window.msCrypto)
    return (
      this.doc.defaultView.crypto || (this.doc.defaultView as any).msCrypto
    );
  }
}
