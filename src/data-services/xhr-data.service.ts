import { Injectable } from '@angular/core';
import * as xhrBase from './xhr-request-base';

@Injectable()
export class XhrDataService {
    loadConfiguration(url: string) {
        return xhrBase.request('get', url);
    }
}
