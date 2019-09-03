import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UrlParserService {
    getUrlParameter(urlToCheck, name): string {
        if (!urlToCheck) {
            return '';
        }

        if (!name) {
            return '';
        }

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(urlToCheck);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}
